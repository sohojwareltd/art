import { useAuth } from '../contexts/AuthContext';
import { useSavedArtworks } from '../hooks/useArtworks';
import GalleryGrid from '../components/artwork/GalleryGrid';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const { user, loading: authLoading } = useAuth();
    const { data: savedData, isLoading } = useSavedArtworks(!!user);
    const navigate = useNavigate();

    if (authLoading) {
        return (
            <div className="pt-20 sm:pt-24 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 text-center">
                <p className="text-[#6B7280] text-sm sm:text-base">Loading...</p>
            </div>
        );
    }

    if (!user) {
        navigate('/');
        return null;
    }

    const artworks = savedData?.data || [];

    return (
        <div className="pt-16 sm:pt-20">
            <section className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 py-12 sm:py-16 md:py-20 lg:py-32">
                <div className="mb-12 sm:mb-16 md:mb-20">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif mb-4 sm:mb-6 text-[#0A0A0A] font-normal">
                        Saved Artworks
                    </h1>
                    <p className="text-xs sm:text-sm text-[#6B7280] uppercase tracking-wider">
                        {artworks.length} {artworks.length === 1 ? 'artwork' : 'artworks'}
                    </p>
                </div>

                <GalleryGrid
                    artworks={artworks}
                    loading={isLoading}
                    hasMore={false}
                    onLoadMore={() => {}}
                />
            </section>
        </div>
    );
}
