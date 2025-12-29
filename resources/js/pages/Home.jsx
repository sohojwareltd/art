import { useMemo, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useArtworks, useSearchArtworks } from '../hooks/useArtworks';
import GalleryGrid from '../components/artwork/GalleryGrid';

export default function Home({ searchQuery = '' }) {
    const location = useLocation();
    const hasRestoredScrollRef = useRef(false);
    const [scrollY, setScrollY] = useState(0);
    const backgroundRef = useRef(null);

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

    // Parallax scroll for burgundy background
    useEffect(() => {
        let rafId = null;
        const handleScroll = () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            
            rafId = requestAnimationFrame(() => {
                setScrollY(window.scrollY);
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial calculation
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        };
    }, []);

    // Calculate parallax offset for background (slower than content)
    // Background moves at 0.3x speed for smooth parallax effect
    const backgroundOffset = scrollY * 0.3;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const backgroundHeight = viewportHeight * 0.5; // First half of viewport

    return (
        <div className="min-h-screen relative lg:flex">
            {/* Burgundy textured background with parallax - only on right side */}
            <div
                ref={backgroundRef}
                className="hidden lg:block absolute top-0 z-0 pointer-events-none bg-parallax"
                style={{
                    left: '320px',
                    right: 0,
                    width: 'calc(100% - 320px)',
                    height: `${backgroundHeight}px`,
                    transform: `translateY(${backgroundOffset}px)`,
                    willChange: 'transform',
                }}
            >
                <div 
                    className="w-full h-full bg-gradient-to-b from-[#722F37] via-[#8B3A42] to-[#722F37]"
                    style={{
                        backgroundImage: `
                            radial-gradient(circle at 20% 30%, rgba(139, 58, 66, 0.4) 0%, transparent 50%),
                            radial-gradient(circle at 80% 70%, rgba(114, 47, 55, 0.4) 0%, transparent 50%),
                            radial-gradient(circle at 50% 50%, rgba(139, 58, 66, 0.25) 0%, transparent 70%),
                            repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 3px,
                                rgba(0, 0, 0, 0.04) 3px,
                                rgba(0, 0, 0, 0.04) 6px
                            ),
                            repeating-linear-gradient(
                                -45deg,
                                transparent,
                                transparent 3px,
                                rgba(0, 0, 0, 0.03) 3px,
                                rgba(0, 0, 0, 0.03) 6px
                            ),
                            linear-gradient(
                                90deg,
                                rgba(0, 0, 0, 0.05) 0%,
                                transparent 50%,
                                rgba(0, 0, 0, 0.05) 100%
                            )
                        `,
                        backgroundSize: '100% 100%, 100% 100%, 100% 100%, 30px 30px, 30px 30px, 100% 100%',
                        backgroundPosition: '0 0, 0 0, 0 0, 0 0, 0 0, 0 0',
                    }}
                />
            </div>

            {/* Left Sidebar - Desktop only */}
            <div className="hidden lg:block lg:w-[320px] xl:w-[400px] lg:flex-shrink-0" />

            {/* Right Content Area - Gallery */}
            <section className="relative z-10 flex-1 lg:ml-0 px-4 sm:px-4 md:px-6 lg:px-8 xl:px-12 pb-8 sm:pb-4 pt-20 sm:pt-24 md:pt-20 lg:pt-12">
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
