import { useEffect, useRef, useState } from 'react';
import ArtworkCard from './ArtworkCard';

export default function GalleryGrid({ artworks, loading, hasMore, onLoadMore }) {
    const observerTarget = useRef(null);
    const containerRef = useRef(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    // Parallax scroll speeds for each column - more noticeable varying speeds
    // Adjusted for 5 columns (desktop with sidebar)
    const columnSpeeds = [12, 18, 8, 20, 15];

    // Detect mobile/tablet
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // Disable parallax on tablets and mobile
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        // Only enable parallax on desktop
        if (isMobile) {
            setScrollProgress(0);
            return;
        }

        let rafId = null;
        const handleScroll = () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            
            rafId = requestAnimationFrame(() => {
                if (containerRef.current) {
                    const container = containerRef.current;
                    const containerTop = container.getBoundingClientRect().top;
                    const viewportHeight = window.innerHeight;
                    
                    // Calculate progress when container is in viewport
                    if (containerTop < viewportHeight && containerTop > -container.offsetHeight) {
                        const progress = (viewportHeight - containerTop) / (viewportHeight + container.offsetHeight);
                        setScrollProgress(Math.max(0, Math.min(1, progress)));
                    } else if (containerTop >= viewportHeight) {
                        setScrollProgress(0);
                    } else {
                        setScrollProgress(1);
                    }
                }
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
    }, [artworks.length, isMobile]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    onLoadMore();
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, loading, onLoadMore]);

    if (artworks.length === 0 && !loading) {
        return (
            <div className="text-center py-12 md:py-20">
                <p className="text-[#6B7280] text-sm md:text-base">No artworks found</p>
            </div>
        );
    }

    if (artworks.length === 0) {
        return null;
    }

    // Responsive column distribution
    // Desktop with sidebar: 5 columns, Tablet: 3 columns, Mobile: 2 columns
    const getColumnCount = () => {
        if (typeof window !== 'undefined') {
            if (window.innerWidth >= 1024) return 5; // Reduced for sidebar layout
            if (window.innerWidth >= 768) return 3;
            return 2; // Mobile: 2 columns for 2x2 grid effect
        }
        return 5;
    };

    const columnCount = getColumnCount();
    const columns = Array.from({ length: columnCount }, () => []);
    
    artworks.forEach((artwork, index) => {
        columns[index % columnCount].push(artwork);
    });

    // Calculate parallax distance based on scroll progress (desktop only)
    // Balanced multiplier for noticeable effect while controlling height
    const parallaxMultiplier = isMobile ? 0 : 60;
    
    return (
        <>
            <div ref={containerRef} className="relative overflow-hidden">
                <div className="artwork-grid">
                    {columns.map((columnArtworks, columnIndex) => {
                        // Calculate parallax offset - each column moves at different speed (desktop only)
                        // Only apply transform when scrolling, not at initial position
                        const parallaxOffset = isMobile 
                            ? 0 
                            : scrollProgress * parallaxMultiplier * (columnSpeeds[columnIndex] || 0.4);
                        
                        return (
                            <div
                                key={columnIndex}
                                className="artwork-column"
                                style={{
                                    transform: isMobile || parallaxOffset === 0 
                                        ? 'none' 
                                        : `translate3d(0, ${parallaxOffset}px, 0)`,
                                    willChange: isMobile ? 'auto' : 'transform',
                                }}
                            >
                                {columnArtworks.map((artwork, itemIndex) => (
                                    <ArtworkCard
                                        key={artwork.id}
                                        artwork={artwork}
                                        index={columnIndex * 100 + itemIndex}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {hasMore && <div ref={observerTarget} className="h-10 md:h-20" />}
        </>
    );
}
