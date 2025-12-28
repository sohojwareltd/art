<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ImageCacheService
{
    private const CACHE_DIR = 'artwork-images';
    private const CACHE_TTL = 86400 * 7; // 7 days
    private const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

    /**
     * Get cached image URL, or return original if not cached
     * Images are cached on-demand
     */
    public function getCachedImageUrl(string $externalUrl): ?string
    {
        if (empty($externalUrl)) {
            return null;
        }

        $cacheKey = $this->getCacheKey($externalUrl);
        $cachePath = self::CACHE_DIR . '/' . $cacheKey;
        
        // Check if image is already cached
        if (Storage::disk('public')->exists($cachePath)) {
            $url = Storage::disk('public')->url($cachePath);
            return $url ?: $externalUrl;
        }

        // Return original URL - images will be cached on-demand or via background job
        return $externalUrl;
    }
    
    /**
     * Cache image asynchronously (can be called from background job)
     */
    public function cacheImageAsync(string $externalUrl): bool
    {
        if (empty($externalUrl)) {
            return false;
        }

        $cacheKey = $this->getCacheKey($externalUrl);
        $cachePath = self::CACHE_DIR . '/' . $cacheKey;
        
        // Skip if already cached
        if (Storage::disk('public')->exists($cachePath)) {
            return true;
        }

        // Cache the image
        return $this->downloadAndCache($externalUrl, $cachePath) !== null;
    }

    /**
     * Cache multiple images in batch
     */
    public function cacheImagesBatch(array $urls): array
    {
        $results = [];
        
        foreach ($urls as $url) {
            if (empty($url)) {
                continue;
            }
            
            try {
                $cached = $this->cacheImageAsync($url);
                $results[$url] = $cached;
            } catch (\Exception $e) {
                Log::warning('Failed to cache image in batch', [
                    'url' => $url,
                    'error' => $e->getMessage(),
                ]);
                $results[$url] = false;
            }
        }
        
        return $results;
    }

    /**
     * Download and cache image
     */
    private function downloadAndCache(string $url, string $cachePath): ?string
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept' => 'image/*',
                ])
                ->get($url);

            if (!$response->successful()) {
                Log::warning('Failed to download image', [
                    'url' => $url,
                    'status' => $response->status(),
                ]);
                return null;
            }

            $imageData = $response->body();
            $imageSize = strlen($imageData);

            // Only cache images smaller than max size
            if ($imageSize > self::MAX_IMAGE_SIZE) {
                Log::warning('Image too large to cache', [
                    'url' => $url,
                    'size' => $imageSize,
                ]);
                return null;
            }

            // Validate it's actually an image
            $imageInfo = @getimagesizefromstring($imageData);
            if ($imageInfo === false) {
                Log::warning('Downloaded data is not a valid image', ['url' => $url]);
                return null;
            }

            // Store the image
            Storage::disk('public')->put($cachePath, $imageData);

            $url = Storage::disk('public')->url($cachePath);
            return $url ?: null;
        } catch (\Exception $e) {
            Log::warning('Exception while caching image', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Get cache key from URL
     */
    private function getCacheKey(string $url): string
    {
        $hash = md5($url);
        $extension = $this->getExtensionFromUrl($url);
        return $hash . ($extension ? '.' . $extension : '');
    }

    /**
     * Get file extension from URL
     */
    private function getExtensionFromUrl(string $url): string
    {
        $path = parse_url($url, PHP_URL_PATH);
        if ($path) {
            $extension = pathinfo($path, PATHINFO_EXTENSION);
            if (in_array(strtolower($extension), ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
                return strtolower($extension);
            }
        }
        return 'jpg'; // Default extension
    }

    /**
     * Clear all cached images
     */
    public function clearCache(): void
    {
        try {
            Storage::disk('public')->deleteDirectory(self::CACHE_DIR);
            Log::info('Image cache cleared');
        } catch (\Exception $e) {
            Log::error('Failed to clear image cache', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get cache statistics
     */
    public function getCacheStats(): array
    {
        try {
            $files = Storage::disk('public')->files(self::CACHE_DIR);
            $totalSize = 0;
            
            foreach ($files as $file) {
                $totalSize += Storage::disk('public')->size($file);
            }
            
            return [
                'count' => count($files),
                'total_size' => $totalSize,
                'total_size_mb' => round($totalSize / 1024 / 1024, 2),
            ];
        } catch (\Exception $e) {
            return [
                'count' => 0,
                'total_size' => 0,
                'total_size_mb' => 0,
            ];
        }
    }
}
