import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect } from 'react';
import Image from '../ui/Image';
import { usePrefetchArtwork } from '../../hooks/useArtworks';

export default function ArtworkCard({ artwork, index = 0 }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });
    const { prefetchArtwork } = usePrefetchArtwork();
    const hasPrefetchedRef = useRef(false);
    
    // Use consistent aspect ratio for column layout
    const aspectRatio = 'aspect-[3/4]';

    // Prefetch when card comes into view (for better UX)
    useEffect(() => {
        if (isInView && !hasPrefetchedRef.current) {
            // Small delay to avoid prefetching all visible cards at once
            const timer = setTimeout(() => {
                prefetchArtwork(artwork.id);
                hasPrefetchedRef.current = true;
            }, index * 100); // Stagger prefetch requests

            return () => clearTimeout(timer);
        }
    }, [isInView, artwork.id, prefetchArtwork, index]);

    const handleMouseEnter = () => {
        // Prefetch on hover as well (in case it wasn't prefetched yet)
        if (!hasPrefetchedRef.current) {
            prefetchArtwork(artwork.id);
            hasPrefetchedRef.current = true;
        }
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 60 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
            transition={{ 
                duration: 0.8, 
                delay: (index % 6) * 0.1,
                ease: [0.16, 1, 0.3, 1]
            }}
        >
            <Link 
                to={`/artwork/${artwork.id}`} 
                state={{ fromGallery: true }}
                onMouseEnter={handleMouseEnter}
                onClick={() => {
                    // Save scroll position before navigating
                    sessionStorage.setItem('artworkScrollPosition', window.scrollY.toString());
                }}
                className="block group touch-manipulation cursor-none"
            >
                <div className="relative overflow-hidden bg-gradient-to-br from-[#8B3A42]/5 via-neutral-50 to-[#B8860B]/5 rounded-[10px] border border-[#8B3A42]/10 lg:bg-neutral-50 lg:border-0">
                    {artwork.image_url ? (
                        <motion.div 
                            className={`${aspectRatio} w-full relative overflow-hidden`}
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        >
                            <Image
                                src={artwork.image_url}
                                alt={artwork.title}
                                className="absolute inset-0 w-full h-full object-cover"
                                lazy
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-[#8B3A42]/70 via-black/60 to-[#8B3A42]/70 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300 pointer-events-none z-20 flex flex-col justify-between p-4 md:p-6 lg:bg-black/60">
                                {/* Top Section - Title and Year */}
                                <div className="space-y-1.5">
                                    <h3 className="text-base md:text-lg text-white font-serif font-normal leading-tight line-clamp-2 tracking-tight">
                                        {artwork.title}
                                    </h3>
                                    {artwork.date && (
                                        <p className="text-sm md:text-base text-white/70 font-serif font-normal tracking-tight">
                                            {artwork.date}
                                        </p>
                                    )}
                                </div>

                                {/* Bottom Section - Category/Medium */}
                                {artwork.medium && (
                                    <div className="self-start">
                                        <p className="text-xs md:text-sm text-white/80 font-serif font-normal tracking-tight">
                                            {artwork.medium}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <div className={`${aspectRatio} w-full flex items-center justify-center bg-neutral-100`}>
                            <span className="text-neutral-300 text-[10px] md:text-xs uppercase tracking-wider">No image</span>
                        </div>
                    )}
                </div>
            </Link>
        </motion.div>
    );
}
