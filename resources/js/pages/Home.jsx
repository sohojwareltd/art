import { useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useArtworks, useSearchArtworks } from '../hooks/useArtworks';
import GalleryGrid from '../components/artwork/GalleryGrid';

export default function Home({ searchQuery = '' }) {
    const location = useLocation();
    const hasRestoredScrollRef = useRef(false);

    const { data: artworksData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useArtworks();
    const {
        data: searchData,
        fetchNextPage: fetchNextSearchPage,
        hasNextPage: hasNextSearchPage,
        isFetchingNextPage: isFetchingNextSearch,
        isLoading: isSearchLoading,
    } = useSearchArtworks(searchQuery);

    const isSearching = searchQuery.length > 0;

    const artworks = useMemo(() => {
        if (isSearching) {
            return searchData?.pages.flatMap((page) => page.data) || [];
        }
        return artworksData?.pages.flatMap((page) => page.data) || [];
    }, [artworksData, searchData, isSearching]);

    const handleLoadMore = () => {
        if (isSearching) {
            if (hasNextSearchPage && !isFetchingNextSearch) {
                fetchNextSearchPage();
            }
        } else {
            if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        }
    };

    const isLoadingState = isSearching ? isSearchLoading : isLoading;
    const hasMore = isSearching ? hasNextSearchPage : hasNextPage;
    const isFetchingMore = isSearching ? isFetchingNextSearch : isFetchingNextPage;

    // Restore scroll position when returning from detail page
    useEffect(() => {
        if (location.state?.fromDetail && !hasRestoredScrollRef.current) {
            const savedPosition = sessionStorage.getItem('artworkScrollPosition');
            if (savedPosition) {
                // Use requestAnimationFrame to ensure DOM is ready
                requestAnimationFrame(() => {
                    window.scrollTo({
                        top: parseInt(savedPosition, 10),
                        behavior: 'instant'
                    });
                    hasRestoredScrollRef.current = true;
                    sessionStorage.removeItem('artworkScrollPosition');
                });
            }
        }
    }, [location.state]);

    // Reset restore flag when component mounts fresh (not from detail page)
    useEffect(() => {
        if (!location.state?.fromDetail) {
            hasRestoredScrollRef.current = false;
        }
    }, [location.state]);

    return (
        <div className="pt-16 sm:pt-20 min-h-screen">
            <section className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 py-12 sm:py-16 md:py-20 lg:py-32">
                <GalleryGrid
                    artworks={artworks}
                    loading={isLoadingState || isFetchingMore}
                    hasMore={hasMore}
                    onLoadMore={handleLoadMore}
                />
            </section>
        </div>
    );
}
