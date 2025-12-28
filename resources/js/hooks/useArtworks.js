import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

// Global set to track prefetched artworks across all components
const prefetchedArtworks = new Set();

// Retry function with exponential backoff for 404 and 403 errors
const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            const status = error.response?.status;
            const isRetryable = status === 404 || status === 403; // Retry on 404 and 403
            const isLastAttempt = attempt === maxRetries - 1;
            
            if (isRetryable && !isLastAttempt) {
                // Wait before retrying (exponential backoff)
                const waitTime = delay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            
            // If not retryable or last attempt, throw the error
            throw error;
        }
    }
};

export function useArtworks() {
    const perPage = 20;

    const query = useInfiniteQuery({
        queryKey: ['artworks'],
        queryFn: async ({ pageParam = 1 }) => {
            const response = await client.get('/artworks', {
                params: {
                    page: pageParam,
                    per_page: perPage,
                },
            });

            return response.data;
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.current_page < lastPage.last_page) {
                return lastPage.current_page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
    });

    return query;
}

export function useArtwork(id) {
    return useQuery({
        queryKey: ['artwork', id],
        queryFn: async () => {
            // Retry on 404 and 403 errors with exponential backoff
            return await retryWithBackoff(async () => {
                const response = await client.get(`/artworks/${id}`, {
                    // Add timestamp to bypass cache on retry
                    params: { _retry: Date.now() },
                });
                
                if (!response.data) {
                    const error = new Error('Artwork not found');
                    error.response = { status: 404 };
                    throw error;
                }
                return response.data;
            }, 3, 1000); // 3 retries with 1s, 2s, 4s delays
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error) => {
            // Don't retry on 404s/403s here, we handle it in queryFn
            // Only retry on network errors
            const status = error.response?.status;
            if (status === 404 || status === 403) {
                return false;
            }
            return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
}

export function usePrefetchArtwork() {
    const queryClient = useQueryClient();

    const prefetchArtwork = (id) => {
        if (!id || prefetchedArtworks.has(id)) {
            return;
        }

        // Mark as prefetching to avoid duplicate requests
        prefetchedArtworks.add(id);

        queryClient.prefetchQuery({
            queryKey: ['artwork', id],
            queryFn: async () => {
                return await retryWithBackoff(async () => {
                    const response = await client.get(`/artworks/${id}`, {
                        params: { _retry: Date.now() },
                    });
                    return response.data;
                }, 2, 500); // 2 retries for prefetch
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
        }).catch(() => {
            // On error, remove from set so it can be retried
            prefetchedArtworks.delete(id);
        });
    };

    return { prefetchArtwork };
}

export function useSearchArtworks(query) {
    const perPage = 20;

    const searchQuery = useInfiniteQuery({
        queryKey: ['artworks', 'search', query],
        queryFn: async ({ pageParam = 1 }) => {
            const response = await client.get('/search', {
                params: {
                    q: query,
                    page: pageParam,
                    per_page: perPage,
                },
            });

            return response.data;
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.current_page < lastPage.last_page) {
                return lastPage.current_page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: !!query && query.length > 0,
    });

    return searchQuery;
}

export function useSavedArtworks(enabled = true) {
    return useQuery({
        queryKey: ['saved-artworks'],
        queryFn: () => client.get('/user/saved').then((res) => res.data),
        enabled,
    });
}
