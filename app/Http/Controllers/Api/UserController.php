<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function saved(Request $request)
    {
        $savedArtworks = $request->user()
            ->savedArtworks()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($savedArtwork) {
                return $savedArtwork->metadata;
            });

        return response()->json([
            'data' => $savedArtworks,
            'total' => $savedArtworks->count(),
        ]);
    }
}
