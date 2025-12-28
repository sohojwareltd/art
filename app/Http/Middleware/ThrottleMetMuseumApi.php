<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class ThrottleMetMuseumApi
{
    /**
     * Handle an incoming request.
     * 
     * Met Museum API limit: 80 requests per second
     * We'll use a sliding window to track requests
     */
    public function handle(Request $request, Closure $next): Response
    {
        $key = 'met_api_requests';
        $window = 1; // 1 second window
        $maxRequests = 70; // Stay under 80 req/s for safety
        
        $requests = Cache::get($key, []);
        $now = now()->timestamp;
        
        // Remove requests older than the window
        $requests = array_filter($requests, function ($timestamp) use ($now, $window) {
            return ($now - $timestamp) < $window;
        });
        
        // Check if we're at the limit
        if (count($requests) >= $maxRequests) {
            // Calculate wait time
            $oldestRequest = min($requests);
            $waitTime = $window - ($now - $oldestRequest) + 0.1; // Add 0.1s buffer
            
            if ($waitTime > 0) {
                usleep((int)($waitTime * 1000000)); // Convert to microseconds
            }
            
            // Re-check after wait
            $requests = Cache::get($key, []);
            $requests = array_filter($requests, function ($timestamp) use ($now, $window) {
                return ($now - $timestamp) < $window;
            });
        }
        
        // Add current request
        $requests[] = $now;
        Cache::put($key, $requests, $window);
        
        return $next($request);
    }
}

