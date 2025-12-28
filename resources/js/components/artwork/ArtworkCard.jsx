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
                className="block group touch-manipulation"
            >
                <div className="relative overflow-hidden bg-neutral-50 mb-4 md:mb-6">
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
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300 flex items-end p-4 md:p-6 pointer-events-none z-20">
                                <div className="space-y-1 md:space-y-2 w-full">
                                    <p className="text-xs md:text-sm text-white font-light line-clamp-2">
                                        {artwork.title}
                                    </p>
                                    {artwork.artist && artwork.artist !== 'Unknown Artist' && (
                                        <p className="text-[10px] md:text-xs text-white/90 uppercase tracking-wider line-clamp-1">
                                            {artwork.artist}
                                            {artwork.date && `, ${artwork.date}`}
                                        </p>
                                    )}
                                </div>
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
