<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavedArtwork;
use App\Services\MetMuseumService;
use Illuminate\Http\Request;

class SavedArtworkController extends Controller
{
    public function __construct(
        private MetMuseumService $metMuseumService
    ) {}

    public function save(Request $request, string $id)
    {
        $artwork = $this->metMuseumService->getObject((int) $id);

        if (!$artwork) {
            return response()->json([
                'message' => 'Artwork not found',
            ], 404);
        }

        $savedArtwork = SavedArtwork::firstOrCreate(
            [
                'user_id' => $request->user()->id,
                'artwork_id' => $id,
                'source' => 'met',
            ],
            [
                'metadata' => $artwork,
            ]
        );

        return response()->json([
            'message' => 'Artwork saved successfully',
            'saved_artwork' => $savedArtwork,
        ], 201);
    }

    public function unsave(Request $request, string $id)
    {
        $savedArtwork = SavedArtwork::where('user_id', $request->user()->id)
            ->where('artwork_id', $id)
            ->where('source', 'met')
            ->first();

        if (!$savedArtwork) {
            return response()->json([
                'message' => 'Saved artwork not found',
            ], 404);
        }

        $savedArtwork->delete();

        return response()->json([
            'message' => 'Artwork unsaved successfully',
        ]);
    }
}
