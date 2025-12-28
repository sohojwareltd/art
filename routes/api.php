<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ArtworkController;
use App\Http\Controllers\Api\SavedArtworkController;
use App\Http\Controllers\Api\UserController;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});

Route::get('/artworks', [ArtworkController::class, 'index']);
Route::get('/artworks/{id}', [ArtworkController::class, 'show']);
Route::get('/search', [ArtworkController::class, 'search']);
Route::get('/departments', [ArtworkController::class, 'departments']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/artworks/{id}/save', [SavedArtworkController::class, 'save']);
    Route::delete('/artworks/{id}/save', [SavedArtworkController::class, 'unsave']);
    Route::get('/user/saved', [UserController::class, 'saved']);
});

