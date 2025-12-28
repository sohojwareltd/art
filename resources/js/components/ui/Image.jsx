import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Image({ src, alt, className = '', lazy = true }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    if (error) {
        return (
            <div className={`bg-neutral-100 flex items-center justify-center ${className}`}>
                <span className="text-neutral-400 text-sm">Image not available</span>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {!loaded && (
                <div className="absolute inset-0 bg-neutral-100 animate-pulse z-0" />
            )}
            <motion.img
                src={src}
                alt={alt}
                loading={lazy ? 'lazy' : 'eager'}
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: loaded ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full object-cover relative z-10 block"
            />
        </div>
    );
}

