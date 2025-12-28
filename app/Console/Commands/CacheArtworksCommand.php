<?php

namespace App\Console\Commands;

use App\Jobs\CacheArtworkPageJob;
use App\Services\MetMuseumService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CacheArtworksCommand extends Command
{
    protected $signature = 'artworks:cache 
                            {--first=100 : Number of artworks to cache immediately}
                            {--per-page=20 : Number of artworks per page}
                            {--background : Only queue background jobs, skip immediate caching}';

    protected $description = 'Cache artworks: first N immediately, rest in background';

    public function handle(MetMuseumService $metMuseumService): int
    {
        $firstCount = (int) $this->option('first');
        $perPage = (int) $this->option('per-page');
        $backgroundOnly = $this->option('background');
        
        $this->info("Starting artwork caching process...");
        $this->info("First {$firstCount} artworks will be cached immediately");
        $this->info("Remaining artworks will be queued for background processing");

        try {
            // Get the objectIDs list (this will be cached for 24 hours)
            $this->info("Fetching object IDs list from API...");
            $objectIDs = $metMuseumService->getObjectIDs();

            if (empty($objectIDs)) {
                $this->error("No object IDs found. Please check API connection.");
                return Command::FAILURE;
            }

            $totalObjects = count($objectIDs);
            $totalPages = (int) ceil($totalObjects / $perPage);
            $firstPages = (int) ceil($firstCount / $perPage);

            $this->info("Total artworks: {$totalObjects}");
            $this->info("Total pages: {$totalPages}");
            $this->info("First pages to cache: {$firstPages}");

            // Cache first N pages immediately
            if (!$backgroundOnly) {
                $this->info("\nCaching first {$firstPages} pages immediately...");
                $bar = $this->output->createProgressBar($firstPages);
                $bar->start();

                for ($page = 1; $page <= $firstPages; $page++) {
                    try {
                        $metMuseumService->getObjects($page, $perPage);
                        $bar->advance();
                    } catch (\Exception $e) {
                        $this->newLine();
                        $this->warn("Failed to cache page {$page}: " . $e->getMessage());
                    }
                }

                $bar->finish();
                $this->newLine(2);
                $this->info("✓ Cached first {$firstPages} pages ({$firstCount} artworks)");
            }

            // Queue remaining pages for background processing
            $remainingPages = $totalPages - $firstPages;
            
            if ($remainingPages > 0) {
                $this->info("\nQueueing {$remainingPages} pages for background processing...");
                $bar = $this->output->createProgressBar($remainingPages);
                $bar->start();

                $queuedCount = 0;
                for ($page = $firstPages + 1; $page <= $totalPages; $page++) {
                    CacheArtworkPageJob::dispatch($page, $perPage);
                    $queuedCount++;
                    $bar->advance();
                }

                $bar->finish();
                $this->newLine(2);
                $this->info("✓ Queued {$queuedCount} pages for background processing");
            } else {
                $this->info("No remaining pages to queue.");
            }

            $this->newLine();
            $this->info("Cache warming complete!");
            $this->info("Run 'php artisan queue:work' to process background jobs");

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
            Log::error('Cache artworks command failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return Command::FAILURE;
        }
    }
}

