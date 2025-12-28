import { useParams, useNavigate } from 'react-router-dom';
import { useArtwork } from '../hooks/useArtworks';
import ArtworkDetail from '../components/artwork/ArtworkDetail';
import Skeleton from '../components/ui/Skeleton';

export default function ArtworkDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: artwork, isLoading, error } = useArtwork(id);

    if (isLoading) {
        return (
            <div className="pt-20 sm:pt-24 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16">
                <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
                    <Skeleton className="aspect-square w-full" />
                    <div className="space-y-4 sm:space-y-6">
                        <Skeleton className="h-16 sm:h-20 md:h-24 w-full" />
                        <Skeleton className="h-6 sm:h-8 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        console.error('Error loading artwork:', error);
        return (
            <div className="pt-20 sm:pt-24 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 text-center">
                <p className="text-[#6B7280] text-sm sm:text-base">Error loading artwork: {error.message}</p>
            </div>
        );
    }

    if (!artwork) {
        return (
            <div className="pt-20 sm:pt-24 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 text-center">
                <p className="text-[#6B7280] text-sm sm:text-base">Artwork not found</p>
            </div>
        );
    }

    const handleClose = () => {
        navigate('/', { state: { fromDetail: true } });
    };

    return <ArtworkDetail artwork={artwork} onClose={handleClose} />;
}
