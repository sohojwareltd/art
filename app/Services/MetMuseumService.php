<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MetMuseumService
{
    private const BASE_URL = 'https://collectionapi.metmuseum.org/public/collection/v1';
    private const CACHE_TTL = 3600; // 1 hour for artwork details
    private const OBJECT_IDS_CACHE_TTL = 86400; // 24 hours for object IDs list
    private const MAX_CONCURRENT_REQUESTS = 50; // Stay under 80 req/s limit
    private const REQUEST_TIMEOUT = 10; // 10 seconds timeout

    // Track in-flight requests to prevent duplicates
    private static array $inFlightRequests = [];

    public function __construct(
        private ImageCacheService $imageCacheService
    ) {}

    /**
     * Get all object IDs with images (cached for 24 hours)
     */
    public function getObjectIDs(bool $highlightsOnly = false): array
    {
        $cacheKey = $highlightsOnly ? "met_objectIDs_highlights" : "met_objectIDs_hasImages";
        
        return Cache::remember($cacheKey, self::OBJECT_IDS_CACHE_TTL, function () use ($highlightsOnly) {
            $params = ['hasImages' => true];
            if ($highlightsOnly) {
                $params['isHighlight'] = true;
            } else {
                $params['q'] = '*';
            }

            $response = $this->makeApiRequest('/search', $params, 30);

            if (!$response) {
                Log::error('Met Museum API search failed', [
                    'highlights_only' => $highlightsOnly,
                ]);
                return [];
            }

            if (!$response->successful()) {
                Log::error('Met Museum API search failed', [
                    'highlights_only' => $highlightsOnly,
                    'status' => $response->status(),
                ]);
                return [];
            }

            $data = $response->json();
            return $data['objectIDs'] ?? [];
        });
    }

    /**
     * Search artworks with optional filters
     */
    public function search(
        string $query,
        int $page = 1,
        int $perPage = 20,
        ?int $departmentId = null,
        ?bool $isHighlight = null
    ): array {
        $cacheKey = "met_search_" . md5("{$query}_{$page}_{$perPage}_{$departmentId}_{$isHighlight}");

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($query, $page, $perPage, $departmentId, $isHighlight) {
            try {
                $params = [
                    'q' => $query,
                    'hasImages' => true,
                ];

                if ($departmentId !== null) {
                    $params['departmentId'] = $departmentId;
                }

                if ($isHighlight !== null) {
                    $params['isHighlight'] = $isHighlight ? 'true' : 'false';
                }

                $response = $this->makeApiRequest('/search', $params);

                if (!$response) {
                    Log::error('Met Museum API search failed', [
                        'query' => $query,
                    ]);
                    return $this->emptyResponse();
                }

                if (!$response->successful()) {
                    Log::error('Met Museumimage.png API search failed', [
                        'query' => $query,
                        'status' => $response->status(),
                    ]);
                    
                    if ($response->status() === 403) {
                        Log::warning('Met Museum API blocked request');
                    }
                    
                    return $this->emptyResponse();
                }

                $data = $response->json();
                $objectIDs = $data['objectIDs'] ?? [];

                $skip = ($page - 1) * $perPage;
                $paginatedIDs = array_slice($objectIDs, $skip, $perPage);

                $artworks = $this->fetchArtworkDetails($paginatedIDs, $perPage);

                return [
                    'data' => $artworks,
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => count($objectIDs),
                    'last_page' => ceil(count($objectIDs) / $perPage),
                ];
            } catch (\Exception $e) {
                Log::error('Met Museum API exception', [
                    'query' => $query,
                    'error' => $e->getMessage(),
                ]);
                return $this->emptyResponse();
            }
        });
    }

    /**
     * Get paginated objects with optional filters
     */
    public function getObjects(
        int $page = 1,
        int $perPage = 20,
        bool $highlightsOnly = false,
        ?int $departmentId = null
    ): array {
        $cacheKey = "met_objects_" . md5("{$page}_{$perPage}_{$highlightsOnly}_{$departmentId}");

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($page, $perPage, $highlightsOnly, $departmentId) {
            try {
                // Cache objectIDs list separately with longer TTL
                $objectIDsCacheKey = $highlightsOnly ? "met_objectIDs_highlights" : "met_objectIDs_hasImages";
                $objectIDs = Cache::remember($objectIDsCacheKey, self::OBJECT_IDS_CACHE_TTL, function () use ($highlightsOnly, $departmentId) {
                    $params = ['hasImages' => true];
                    
                    if ($highlightsOnly) {
                        $params['isHighlight'] = true;
                    } else {
                        $params['q'] = '*';
                    }
                    
                    if ($departmentId !== null) {
                        $params['departmentId'] = $departmentId;
                    }

                    $response = $this->makeApiRequest('/search', $params, 30);

                    if (!$response) {
                        Log::error('Met Museum API search failed');
                        return [];
                    }

                    if (!$response->successful()) {
                        Log::error('Met Museum API search failed', [
                            'status' => $response->status(),
                        ]);
                        return [];
                    }

                    $data = $response->json();
                    return $data['objectIDs'] ?? [];
                });

                if (empty($objectIDs)) {
                    return $this->emptyResponse();
                }

                $skip = ($page - 1) * $perPage;
                $paginatedIDs = array_slice($objectIDs, $skip, $perPage);

                if (empty($paginatedIDs)) {
                    return $this->emptyResponse();
                }

                $artworks = $this->fetchArtworkDetails($paginatedIDs, $perPage);

                return [
                    'data' => $artworks,
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => count($objectIDs),
                    'last_page' => ceil(count($objectIDs) / $perPage),
                ];
            } catch (\Exception $e) {
                Log::error('Met Museum API exception', ['error' => $e->getMessage()]);
                return $this->emptyResponse();
            }
        });
    }

    /**
     * Get single artwork by ID with request deduplication and retry logic
     */
    public function getObject(int $objectID, bool $forceRetry = false): ?array
    {
        $cacheKey = "met_object_{$objectID}";
        $failureCacheKey = "met_object_failed_{$objectID}";
        $lockKey = "met_object_lock_{$objectID}";
        
        // If force retry, clear failure cache
        if ($forceRetry) {
            Cache::forget($failureCacheKey);
        }
        
        // Check if we've recently failed to fetch this artwork (but allow retries)
        // For 404s and 403s, we cache failures for shorter time to allow retries
        $failureData = Cache::get($failureCacheKey);
        if ($failureData && !$forceRetry) {
            if (is_array($failureData)) {
                $status = $failureData['status'] ?? null;
                $failedAt = $failureData['failed_at'] ?? 0;
                $timeSinceFailure = time() - $failedAt;
                
                // For 404s and 403s, allow retry after 2 minutes (shorter for temporary blocks)
                if (in_array($status, [404, 403]) && $timeSinceFailure < 120) { // 2 minutes
                    return null;
                } elseif ($status !== null && $timeSinceFailure < 300) {
                    // Other errors: 5 minutes
                    return null;
                }
            } elseif (!is_array($failureData)) {
                // Legacy format - allow retry after 5 minutes
                return null;
            }
        }

        // Check cache first
        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return $cached;
        }

        // Use lock to prevent duplicate concurrent requests
        $lock = Cache::lock($lockKey, 30); // 30 second lock
        
        if ($lock->get()) {
            try {
                // Double-check cache after acquiring lock (another request might have cached it)
                $cached = Cache::get($cacheKey);
                if ($cached !== null) {
                    return $cached;
                }

                // Try fetching with retries
                $artwork = $this->fetchSingleArtworkWithRetry($objectID, $failureCacheKey);
                
                if ($artwork !== null) {
                    Cache::put($cacheKey, $artwork, self::CACHE_TTL);
                    // Clear failure cache on success
                    Cache::forget($failureCacheKey);
                }
                
                return $artwork;
            } finally {
                $lock->release();
            }
        } else {
            // Another request is fetching this, wait a bit and check cache
            usleep(100000); // 100ms
            return Cache::get($cacheKey);
        }
    }

    /**
     * Fetch single artwork from API with retry logic for 404s
     */
    private function fetchSingleArtworkWithRetry(int $objectID, string $failureCacheKey, int $maxRetries = 3): ?array
    {
        $retryDelays = [1, 2, 4]; // Seconds to wait between retries
        
        for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
            try {
                $artwork = $this->fetchSingleArtwork($objectID, $failureCacheKey, $attempt);
                
                // If we got artwork, return it
                if ($artwork !== null) {
                    return $artwork;
                }
                
                // If this is not the last attempt and we got a 404 or 403, retry
                if ($attempt < $maxRetries - 1) {
                    $failureData = Cache::get($failureCacheKey);
                    $status = is_array($failureData) ? ($failureData['status'] ?? null) : null;
                    $shouldRetry = in_array($status, [404, 403]); // Retry on 404 and 403 (temporary blocks)
                    
                    if ($shouldRetry) {
                        $delay = $retryDelays[$attempt] ?? 2;
                        Log::info('Retrying artwork fetch after error', [
                            'objectID' => $objectID,
                            'status' => $status,
                            'attempt' => $attempt + 1,
                            'delay' => $delay,
                        ]);
                        sleep($delay);
                        // Clear failure cache to allow retry
                        Cache::forget($failureCacheKey);
                        continue;
                    }
                }
                
                // If not 404 or last attempt, return null
                return null;
            } catch (\Exception $e) {
                Log::error('Met Museum API exception during retry', [
                    'objectID' => $objectID,
                    'attempt' => $attempt + 1,
                    'error' => $e->getMessage(),
                ]);
                
                // If last attempt, cache failure
                if ($attempt === $maxRetries - 1) {
                    Cache::put($failureCacheKey, [
                        'status' => 500,
                        'failed_at' => time(),
                    ], 300);
                }
            }
        }
        
        return null;
    }

    /**
     * Fetch single artwork from API
     */
    private function fetchSingleArtwork(int $objectID, string $failureCacheKey, int $attempt = 0): ?array
    {
        try {
            $response = $this->makeApiRequest("/objects/{$objectID}");

            if (!$response) {
                Cache::put($failureCacheKey, [
                    'status' => 500,
                    'failed_at' => time(),
                ], 300);
                return null;
            }

            if (!$response->successful()) {
                $status = $response->status();
                
                if ($status === 404) {
                    // Artwork doesn't exist - cache the failure with shorter TTL for retries
                    Cache::put($failureCacheKey, [
                        'status' => 404,
                        'failed_at' => time(),
                    ], 300); // 5 minutes instead of 1 hour to allow retries
                    Log::info('Artwork not found in Met Museum API', [
                        'objectID' => $objectID,
                        'attempt' => $attempt + 1,
                    ]);
                    return null;
                } elseif ($status === 403) {
                    // API blocked - cache failure for 2 minutes (shorter for temporary blocks)
                    Cache::put($failureCacheKey, [
                        'status' => 403,
                        'failed_at' => time(),
                    ], 120); // 2 minutes instead of 5
                    Log::warning('Met Museum API blocked request', [
                        'objectID' => $objectID,
                        'attempt' => $attempt + 1,
                    ]);
                    return null;
                }
                
                // Cache other failures for 5 minutes
                Cache::put($failureCacheKey, [
                    'status' => $status,
                    'failed_at' => time(),
                ], 300);
                Log::error('Met Museum API object failed', [
                    'objectID' => $objectID,
                    'status' => $status,
                    'attempt' => $attempt + 1,
                ]);
                return null;
            }

            $data = $response->json();
            
            // Validate response has objectID
            if (empty($data['objectID'])) {
                Log::warning('Artwork response missing objectID', [
                    'objectID' => $objectID,
                    'response_keys' => array_keys($data ?? []),
                ]);
                return null;
            }
            
            $normalized = $this->normalizeArtwork($data);
            
            // Validate normalized data has ID
            if (empty($normalized['id'])) {
                Log::warning('Normalized artwork missing ID', ['objectID' => $objectID]);
                return null;
            }
            
            return $normalized;
        } catch (\Exception $e) {
            Log::error('Met Museum API exception', [
                'objectID' => $objectID,
                'error' => $e->getMessage(),
                'attempt' => $attempt + 1,
            ]);
            Cache::put($failureCacheKey, [
                'status' => 500,
                'failed_at' => time(),
            ], 300);
            return null;
        }
    }

    /**
     * Fetch multiple artwork details with optimized parallel requests
     */
    private function fetchArtworkDetails(array $objectIDs, int $targetCount = 20): array
    {
        if (empty($objectIDs)) {
            return [];
        }

        // Fetch more IDs than needed to account for artworks without images
        // Use 1.5x multiplier since hasImages filter should work well
        $maxAttempts = min(count($objectIDs), (int)($targetCount * 1.5));
        $idsToFetch = array_slice($objectIDs, 0, $maxAttempts);

        // Check cache first for all IDs
        $cachedArtworks = [];
        $idsToFetchFromApi = [];
        
        foreach ($idsToFetch as $id) {
            $cached = Cache::get("met_object_{$id}");
            if ($cached !== null && $this->hasValidImage($cached)) {
                $cachedArtworks[] = $cached;
            } else {
                $idsToFetchFromApi[] = $id;
            }
            
            // If we have enough from cache, return early
            if (count($cachedArtworks) >= $targetCount) {
                return array_slice($cachedArtworks, 0, $targetCount);
            }
        }

        // If we have some cached, reduce API calls needed
        $remainingNeeded = $targetCount - count($cachedArtworks);
        if ($remainingNeeded <= 0) {
            return array_slice($cachedArtworks, 0, $targetCount);
        }

        // Fetch remaining from API in batches to respect rate limits
        $batchSize = min(self::MAX_CONCURRENT_REQUESTS, count($idsToFetchFromApi));
        $batches = array_chunk($idsToFetchFromApi, $batchSize);
        
        $artworks = $cachedArtworks;

        foreach ($batches as $batch) {
            if (count($artworks) >= $targetCount) {
                break;
            }

            try {
                $responses = Http::pool(function ($pool) use ($batch) {
                    $requests = [];
                    foreach ($batch as $id) {
                        $requests["artwork_{$id}"] = $pool->timeout(self::REQUEST_TIMEOUT)
                            ->withHeaders($this->getDefaultHeaders())
                            ->get(self::BASE_URL . "/objects/{$id}");
                    }
                    return $requests;
                });

                if (!is_array($responses) || empty($responses)) {
                    continue;
                }

                foreach ($responses as $key => $response) {
                    if (count($artworks) >= $targetCount) {
                        break;
                    }

                    $id = (int) str_replace('artwork_', '', $key);
                    
                    try {
                        if ($response && $response->successful()) {
                            $data = $response->json();
                            
                            if (empty($data['objectID'])) {
                                continue;
                            }
                            
                            $normalized = $this->normalizeArtwork($data);
                            
                            // Only add artworks with images and valid data
                            if ($normalized && $this->hasValidImage($normalized) && !empty($normalized['id'])) {
                                $artworks[] = $normalized;
                                
                                // Cache the artwork
                                Cache::put("met_object_{$id}", $normalized, self::CACHE_TTL);
                            }
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to process artwork details', [
                            'objectID' => $id,
                            'error' => $e->getMessage(),
                        ]);
                        continue;
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Http::pool() failed for batch', [
                    'error' => $e->getMessage(),
                    'batch_size' => count($batch),
                ]);
                
                // Fallback to sequential for this batch
                foreach ($batch as $id) {
                    if (count($artworks) >= $targetCount) {
                        break;
                    }
                    
                    $cached = Cache::get("met_object_{$id}");
                    if ($cached !== null && $this->hasValidImage($cached)) {
                        $artworks[] = $cached;
                        continue;
                    }
                    
                    try {
                        $response = $this->makeApiRequest("/objects/{$id}");
                        
                        if ($response && $response->successful()) {
                            $data = $response->json();
                            
                            if (!empty($data['objectID'])) {
                                $normalized = $this->normalizeArtwork($data);
                                
                                if ($normalized && $this->hasValidImage($normalized) && !empty($normalized['id'])) {
                                    $artworks[] = $normalized;
                                    Cache::put("met_object_{$id}", $normalized, self::CACHE_TTL);
                                }
                            }
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to fetch artwork details sequentially', [
                            'objectID' => $id,
                            'error' => $e->getMessage(),
                        ]);
                        continue;
                    }
                }
            }
        }

        return array_slice($artworks, 0, $targetCount);
    }

    /**
     * Make API request with rate limiting and error handling
     */
    private function makeApiRequest(string $endpoint, array $params = [], int $timeout = self::REQUEST_TIMEOUT)
    {
        $url = self::BASE_URL . $endpoint;
        $requestKey = md5($url . serialize($params));

        // Simple rate limiting: track requests in last second
        $rateLimitKey = 'met_api_rate_limit';
        $requests = Cache::get($rateLimitKey, []);
        $now = microtime(true);
        
        // Remove requests older than 1 second
        $requests = array_filter($requests, function ($timestamp) use ($now) {
            return ($now - $timestamp) < 1.0;
        });
        
        // If approaching limit, wait
        if (count($requests) >= 70) {
            $oldest = min($requests);
            $waitTime = 1.0 - ($now - $oldest) + 0.05; // Add 50ms buffer
            if ($waitTime > 0) {
                usleep((int)($waitTime * 1000000));
            }
            $requests = Cache::get($rateLimitKey, []);
            $requests = array_filter($requests, function ($timestamp) use ($now) {
                return ($now - $timestamp) < 1.0;
            });
        }
        
        // Record this request
        $requests[] = $now;
        Cache::put($rateLimitKey, $requests, 2);

        try {
            $response = Http::timeout($timeout)
                ->withHeaders($this->getDefaultHeaders())
                ->get($url, $params);

            return $response;
        } catch (\Exception $e) {
            Log::error('Met Museum API request exception', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Get default HTTP headers
     */
    private function getDefaultHeaders(): array
    {
        return [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept' => 'application/json',
        ];
    }

    /**
     * Normalize artwork data from API response
     */
    private function normalizeArtwork(array $data): array
    {
        // Get original image URLs from API
        $originalImageUrl = $data['primaryImage'] ?? $data['primaryImageSmall'] ?? null;
        $originalSmallUrl = $data['primaryImageSmall'] ?? null;
        
        // Try to get cached URLs, but always fall back to original if anything fails
        $imageUrl = null;
        $smallUrl = null;
        
        if ($originalImageUrl) {
            try {
                $cachedUrl = $this->imageCacheService->getCachedImageUrl($originalImageUrl);
                $imageUrl = !empty($cachedUrl) ? $cachedUrl : $originalImageUrl;
            } catch (\Exception $e) {
                Log::warning('Error getting cached image URL, using original', [
                    'error' => $e->getMessage(),
                    'original_url' => $originalImageUrl,
                ]);
                $imageUrl = $originalImageUrl;
            }
        }
        
        if ($originalSmallUrl) {
            try {
                $cachedSmallUrl = $this->imageCacheService->getCachedImageUrl($originalSmallUrl);
                $smallUrl = !empty($cachedSmallUrl) ? $cachedSmallUrl : $originalSmallUrl;
            } catch (\Exception $e) {
                Log::warning('Error getting cached small image URL, using original', [
                    'error' => $e->getMessage(),
                    'original_url' => $originalSmallUrl,
                ]);
                $smallUrl = $originalSmallUrl;
            }
        }
        
        // Ensure we always have at least the original URLs
        $finalImageUrl = $imageUrl ?? $originalImageUrl;
        $finalSmallUrl = $smallUrl ?? $originalSmallUrl;
        
        return [
            'id' => (string) ($data['objectID'] ?? ''),
            'title' => $data['title'] ?? 'Untitled',
            'artist' => $data['artistDisplayName'] ?? $data['artistAlphaSort'] ?? 'Unknown Artist',
            'artist_nationality' => $data['artistNationality'] ?? null,
            'artist_birth_date' => $data['artistBeginDate'] ?? null,
            'artist_death_date' => $data['artistEndDate'] ?? null,
            'date' => $data['objectDate'] ?? $data['objectBeginDate'] ?? null,
            'medium' => $data['medium'] ?? null,
            'dimensions' => $data['dimensions'] ?? null,
            'department' => $data['department'] ?? null,
            'culture' => $data['culture'] ?? null,
            'period' => $data['period'] ?? null,
            'dynasty' => $data['dynasty'] ?? null,
            'reign' => $data['reign'] ?? null,
            'portfolio' => $data['portfolio'] ?? null,
            'artist_role' => $data['artistRole'] ?? null,
            'artist_display_bio' => $data['artistDisplayBio'] ?? null,
            'image_url' => $finalImageUrl,
            'image_url_small' => $finalSmallUrl,
            'image_url_large' => $finalImageUrl,
            'additional_images' => $data['additionalImages'] ?? [],
            'repository' => 'The Metropolitan Museum of Art',
            'repository_url' => $data['objectURL'] ?? null,
            'source' => 'met',
        ];
    }

    /**
     * Check if artwork has valid image
     */
    private function hasValidImage(array $artwork): bool
    {
        return !empty($artwork['image_url']);
    }

    /**
     * Get empty response structure
     */
    private function emptyResponse(): array
    {
        return [
            'data' => [],
            'current_page' => 1,
            'per_page' => 20,
            'total' => 0,
            'last_page' => 1,
        ];
    }

    /**
     * Get departments list
     */
    public function getDepartments(): array
    {
        $cacheKey = "met_departments";
        
        return Cache::remember($cacheKey, self::OBJECT_IDS_CACHE_TTL, function () {
            $response = $this->makeApiRequest('/departments');
            
            if (!$response) {
                Log::error('Met Museum API departments failed');
                return [];
            }

            if (!$response->successful()) {
                Log::error('Met Museum API departments failed', [
                    'status' => $response->status(),
                ]);
                return [];
            }
            
            $data = $response->json();
            return $data['departments'] ?? [];
        });
    }
}
