<?php

namespace App\Jobs;

use App\Services\MetMuseumService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CacheArtworkPageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        private int $page,
        private int $perPage = 20
    ) {}

    public function handle(MetMuseumService $metMuseumService): void
    {
        try {
            // This will cache the page automatically via the service
            $metMuseumService->getObjects($this->page, $this->perPage);
            
            Log::info('Cached artwork page', [
                'page' => $this->page,
                'per_page' => $this->perPage,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to cache artwork page', [
                'page' => $this->page,
                'error' => $e->getMessage(),
            ]);
            
            // Retry the job up to 3 times
            if ($this->attempts() < 3) {
                $this->release(60); // Wait 60 seconds before retry
            }
        }
    }
}


