import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import AuthModal from './AuthModal';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');

    const handleLogout = async () => {
        await logout();
    };

    return (
        <aside className="hidden lg:flex lg:flex-col lg:justify-between lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-[320px] xl:w-[400px] lg:px-8 xl:px-12 lg:py-12 xl:py-16 lg:bg-white lg:border-r lg:border-neutral-200 z-40">
            {/* Artist Info Section */}
            <div className="relative">
                {/* Subtle abstract shape/brushstroke background */}
                <div 
                    className="absolute -top-8 -left-8 w-80 h-80 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50,30 Q120,80 200,40 Q250,20 280,60 Q300,100 280,140 Q260,180 220,200 Q180,220 140,210 Q100,200 60,180 Q30,160 20,120 Q10,80 30,50 Z' fill='%23000'/%3E%3C/svg%3E")`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        transform: 'rotate(-15deg)',
                    }}
                />
                
                {/* Artist Name - Stacked Vertically */}
                <div className="relative z-10">
                    <h1 className="text-5xl xl:text-6xl font-serif text-[#0A0A0A] leading-tight mb-6">
                        <span className="block">Art</span>
                        <span className="block">Museum</span>
                    </h1>
                    
                    {/* Dates */}
                    <p className="text-sm xl:text-base text-[#6B7280] font-serif mb-12">
                        The Metropolitan Museum of Art
                    </p>
                    
                    {/* Main Navigation */}
                    <nav className="space-y-2 mb-16">
                        <Link 
                            to="/" 
                            className="block text-base xl:text-lg text-[#0A0A0A] font-serif hover:opacity-70 transition-opacity underline decoration-1 underline-offset-4"
                        >
                            Paintings
                        </Link>
                        <Link 
                            to="/" 
                            className="block text-base xl:text-lg text-[#0A0A0A] font-serif hover:opacity-70 transition-opacity underline decoration-1 underline-offset-4"
                        >
                            Drawings
                        </Link>
                        <Link 
                            to="/" 
                            className="block text-base xl:text-lg text-[#0A0A0A] font-serif hover:opacity-70 transition-opacity underline decoration-1 underline-offset-4"
                        >
                            Sculptures
                        </Link>
                    </nav>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="relative z-10">
                <nav className="mb-6">
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs xl:text-sm text-[#6B7280] font-serif">
                        <Link to="/" className="hover:text-[#0A0A0A] transition-colors underline decoration-1 underline-offset-4">
                            Artist
                        </Link>
                        <span className="text-[#6B7280]">,</span>
                        <Link to="/" className="hover:text-[#0A0A0A] transition-colors underline decoration-1 underline-offset-4">
                            Journal
                        </Link>
                        <span className="text-[#6B7280]">,</span>
                        <Link to="/" className="hover:text-[#0A0A0A] transition-colors underline decoration-1 underline-offset-4">
                            About
                        </Link>
                        <span className="text-[#6B7280]">,</span>
                        <Link to="/" className="hover:text-[#0A0A0A] transition-colors underline decoration-1 underline-offset-4">
                            Video
                        </Link>
                        <span className="text-[#6B7280]">,</span>
                        <Link to="/" className="hover:text-[#0A0A0A] transition-colors underline decoration-1 underline-offset-4">
                            Archive
                        </Link>
                        <span className="text-[#6B7280]">,</span>
                        <Link to="/" className="hover:text-[#0A0A0A] transition-colors underline decoration-1 underline-offset-4">
                            Contact
                        </Link>
                    </div>
                </nav>
                
                {/* User Auth Section */}
                {user ? (
                    <div className="mb-4 text-xs xl:text-sm text-[#6B7280]">
                        <Link 
                            to="/profile"
                            className="hover:text-[#0A0A0A] transition-colors underline decoration-1 underline-offset-4"
                        >
                            Saved
                        </Link>
                        <span className="mx-2">•</span>
                        <span>{user.name}</span>
                        <span className="mx-2">•</span>
                        <button
                            onClick={handleLogout}
                            className="hover:text-[#0A0A0A] transition-colors underline decoration-1 underline-offset-4"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => {
                            setAuthMode('login');
                            setShowAuthModal(true);
                        }}
                        className="text-xs xl:text-sm text-[#6B7280] hover:text-[#0A0A0A] transition-colors underline decoration-1 underline-offset-4"
                    >
                        Login
                    </button>
                )}
                
                {/* Copyright */}
                <p className="text-xs text-[#6B7280] mt-4">
                    Copyright © 2025 Art Museum
                </p>
            </div>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                mode={authMode}
                onSwitchMode={(mode) => setAuthMode(mode)}
            />
        </aside>
    );
}

