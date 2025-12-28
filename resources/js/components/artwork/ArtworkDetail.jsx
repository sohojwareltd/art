import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';
import { useState, useEffect, useMemo } from 'react';
import Image from '../ui/Image';

export default function ArtworkDetail({ artwork, onClose }) {
    const { user } = useAuth();
    const [isSaved, setIsSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    // Calculate font size based on title length - responsive
    const titleFontSize = useMemo(() => {
        const titleLength = artwork.title?.length || 0;
        if (titleLength > 100) {
            return 'text-2xl sm:text-3xl md:text-4xl';
        } else if (titleLength > 60) {
            return 'text-3xl sm:text-4xl md:text-5xl';
        } else if (titleLength > 40) {
            return 'text-4xl sm:text-5xl md:text-6xl';
        } else {
            return 'text-5xl sm:text-6xl md:text-7xl';
        }
    }, [artwork.title]);

    useEffect(() => {
        checkSavedStatus();
    }, [artwork.id, user]);

    const checkSavedStatus = async () => {
        if (!user) {
            setIsSaved(false);
            return;
        }

        try {
            const response = await client.get('/user/saved');
            const savedIds = response.data.data.map((a) => a.id);
            setIsSaved(savedIds.includes(artwork.id.toString()));
        } catch (error) {
            console.error('Error checking saved status:', error);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            if (isSaved) {
                await client.delete(`/artworks/${artwork.id}/save`);
                setIsSaved(false);
            } else {
                await client.post(`/artworks/${artwork.id}/save`);
                setIsSaved(true);
            }
        } catch (error) {
            console.error('Error saving artwork:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-[#FAFAF9] overflow-y-auto"
            >
                <button
                    onClick={onClose}
                    className="fixed top-4 right-4 sm:top-6 sm:right-6 md:top-12 md:right-12 z-50 text-[#0A0A0A] hover:opacity-70 active:opacity-70 transition-opacity text-xs sm:text-sm uppercase tracking-wider p-2 touch-manipulation"
                    aria-label="Close"
                >
                    Close
                </button>

                <div className="min-h-screen flex flex-col">
                    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-12 py-16 sm:py-20 md:py-24">
                        <div className="max-w-6xl w-full">
                            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-start md:items-center">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="relative order-1 md:order-1"
                                >
                                    {artwork.image_url_large || artwork.image_url ? (
                                        <Image
                                            src={artwork.image_url_large || artwork.image_url}
                                            alt={artwork.title}
                                            className="w-full h-auto rounded-sm"
                                            lazy={false}
                                        />
                                    ) : (
                                        <div className="w-full aspect-square bg-neutral-100 flex items-center justify-center">
                                            <span className="text-neutral-400 text-sm">No image available</span>
                                        </div>
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4 sm:space-y-6 order-2 md:order-2"
                                >
                                    <div>
                                        <h1 className={`${titleFontSize} font-serif font-normal leading-tight mb-3 sm:mb-4 text-[#0A0A0A] break-words`}>
                                            {artwork.title}
                                        </h1>
                                        <p className="text-lg sm:text-xl text-[#6B7280]">
                                            {artwork.artist}
                                        </p>
                                        {artwork.date && (
                                            <p className="text-base sm:text-lg text-[#6B7280] mt-1 sm:mt-2">{artwork.date}</p>
                                        )}
                                    </div>

                                    <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-[#6B7280]">
                                        {artwork.medium && (
                                            <div>
                                                <span className="font-medium">Medium: </span>
                                                {artwork.medium}
                                            </div>
                                        )}
                                        {artwork.dimensions && (
                                            <div>
                                                <span className="font-medium">Dimensions: </span>
                                                {artwork.dimensions}
                                            </div>
                                        )}
                                        {artwork.department && (
                                            <div>
                                                <span className="font-medium">Department: </span>
                                                {artwork.department}
                                            </div>
                                        )}
                                        <div>
                                            <span className="font-medium">Repository: </span>
                                            {artwork.repository}
                                        </div>
                                    </div>

                                    {user && (
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-5 sm:px-6 py-2.5 sm:py-3 border border-[#0A0A0A] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white active:bg-[#0A0A0A] active:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs sm:text-sm touch-manipulation min-h-[44px]"
                                        >
                                            {saving ? 'Loading...' : isSaved ? 'Unsave' : 'Save'}
                                        </button>
                                    )}

                                    {artwork.repository_url && (
                                        <a
                                            href={artwork.repository_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block text-xs sm:text-sm text-[#6B7280] hover:text-[#0A0A0A] active:text-[#0A0A0A] transition-colors underline touch-manipulation"
                                        >
                                            View on {artwork.repository} →
                                        </a>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
