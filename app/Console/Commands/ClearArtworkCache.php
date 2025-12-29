<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class ClearArtworkCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'artwork:clear-cache {id? : The artwork ID to clear cache for}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear cache for a specific artwork or all artworks';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $id = $this->argument('id');

        if ($id) {
            $this->clearArtworkCache((int) $id);
            $this->info("Cache cleared for artwork {$id}");
        } else {
            $this->warn('Please specify an artwork ID. Example: php artisan artwork:clear-cache 576558');
            return 1;
        }

        return 0;
    }

    private function clearArtworkCache(int $id): void
    {
        $cacheKey = "met_object_{$id}";
        $failureCacheKey = "met_object_failed_{$id}";
        $lockKey = "met_object_lock_{$id}";

        Cache::forget($cacheKey);
        Cache::forget($failureCacheKey);
        
        // Try to release lock if it exists
        $lock = Cache::lock($lockKey);
        if ($lock->get()) {
            $lock->release();
        }
    }
}



