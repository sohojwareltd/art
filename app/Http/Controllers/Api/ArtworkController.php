<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MetMuseumService;
use App\Jobs\CacheArtworkImagesJob;
use Illuminate\Http\Request;

class ArtworkController extends Controller
{
    public function __construct(
        private MetMuseumService $metMuseumService
    ) {}

    /**
     * Get paginated artworks
     * Supports optional filters: highlights_only, department_id
     */
    public function index(Request $request)
    {
        $page = $request->integer('page', 1);
        $perPage = min($request->integer('per_page', 20), 50);
        $highlightsOnly = $request->boolean('highlights_only', false);
        $departmentId = $request->integer('department_id');

        $result = $this->metMuseumService->getObjects(
            $page,
            $perPage,
            $highlightsOnly,
            $departmentId ?: null
        );

        // Queue image caching for returned artworks in background
        if (!empty($result['data'])) {
            $this->queueImageCaching($result['data']);
        }

        return response()->json($result);
    }

    /**
     * Get single artwork by ID
     */
    public function show(Request $request, string $id)
    {
        // Check if this is a retry request (force retry)
        $forceRetry = $request->has('_retry');
        
        $artwork = $this->metMuseumService->getObject((int) $id, $forceRetry);

        if (!$artwork) {
            return response()->json([
                'message' => 'Artwork not found',
            ], 404);
        }

        // Queue image caching for this artwork in background
        $this->queueImageCaching([$artwork]);

        return response()->json($artwork);
    }

    /**
     * Search artworks
     * Supports optional filters: department_id, is_highlight
     */
    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:1|max:255',
        ]);

        $page = $request->integer('page', 1);
        $perPage = min($request->integer('per_page', 20), 50);
        $departmentId = $request->integer('department_id');
        $isHighlight = $request->has('is_highlight') 
            ? $request->boolean('is_highlight') 
            : null;

        $result = $this->metMuseumService->search(
            $request->q,
            $page,
            $perPage,
            $departmentId ?: null,
            $isHighlight
        );

        // Queue image caching for returned artworks in background
        if (!empty($result['data'])) {
            $this->queueImageCaching($result['data']);
        }

        return response()->json($result);
    }

    /**
     * Get departments list
     */
    public function departments()
    {
        $departments = $this->metMuseumService->getDepartments();

        return response()->json([
            'departments' => $departments,
        ]);
    }

    /**
     * Queue image caching for artworks in background
     */
    private function queueImageCaching(array $artworks): void
    {
        $imageUrls = [];
        
        foreach ($artworks as $artwork) {
            if (!empty($artwork['image_url'])) {
                $imageUrls[] = $artwork['image_url'];
            }
            if (!empty($artwork['image_url_small'])) {
                $imageUrls[] = $artwork['image_url_small'];
            }
        }

        if (!empty($imageUrls)) {
            // Dispatch job to cache images in background
            // Use delay to avoid blocking the response
            CacheArtworkImagesJob::dispatch($imageUrls)->delay(now()->addSeconds(5));
        }
    }
}
