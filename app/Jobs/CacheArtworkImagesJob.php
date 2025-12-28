<?php

namespace App\Jobs;

use App\Services\ImageCacheService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CacheArtworkImagesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        private array $imageUrls,
        private int $tries = 3,
        private int $timeout = 120
    ) {}

    public function handle(ImageCacheService $imageCacheService): void
    {
        try {
            $results = $imageCacheService->cacheImagesBatch($this->imageUrls);
            
            $successCount = count(array_filter($results));
            $totalCount = count($this->imageUrls);
            
            Log::info('Cached artwork images', [
                'success' => $successCount,
                'total' => $totalCount,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to cache artwork images', [
                'error' => $e->getMessage(),
                'url_count' => count($this->imageUrls),
            ]);
            
            throw $e; // Re-throw to trigger retry
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('CacheArtworkImagesJob failed permanently', [
            'error' => $exception->getMessage(),
            'url_count' => count($this->imageUrls),
        ]);
    }
}

