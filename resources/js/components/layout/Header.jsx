import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';
import { useState, useEffect } from 'react';

export default function Header({ searchQuery, onSearchChange }) {
    const { user, logout } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [showMobileDrawer, setShowMobileDrawer] = useState(false);
    const location = useLocation();
    const showSearch = location.pathname === '/';

    const handleLogout = async () => {
        await logout();
        setShowMobileDrawer(false);
    };

    // Close drawer when clicking outside
    useEffect(() => {
        if (showMobileDrawer) {
            const handleClickOutside = (e) => {
                const drawer = document.getElementById('mobile-drawer');
                const overlay = document.getElementById('mobile-drawer-overlay');
                // Close if clicking on overlay or outside the drawer
                if (overlay && e.target === overlay) {
                    setShowMobileDrawer(false);
                } else if (drawer && !drawer.contains(e.target) && !e.target.closest('header')) {
                    setShowMobileDrawer(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showMobileDrawer]);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (showMobileDrawer) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showMobileDrawer]);

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAF9] border-b border-neutral-200/30">
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-6">
                    {/* Mobile Layout - Only show on small screens, not tablet */}
                    <div className="flex lg:hidden flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <Link 
                                to="/" 
                                className="text-2xl font-serif text-[#0A0A0A] hover:opacity-70 transition-opacity leading-tight"
                                onClick={() => setShowMobileMenu(false)}
                            >
                                Art Museum
                            </Link>
                            
                            <button
                                onClick={() => setShowMobileDrawer(!showMobileDrawer)}
                                className="text-[#0A0A0A] p-2"
                                aria-label="Menu"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {showMobileDrawer ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                        
                        {showSearch && (
                            <div className="w-full">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery || ''}
                                    onChange={(e) => onSearchChange?.(e.target.value)}
                                    className="w-full px-0 py-2 text-sm border-b border-neutral-300 focus:border-[#0A0A0A] focus:outline-none bg-transparent text-[#0A0A0A] placeholder:text-neutral-400 font-serif font-normal"
                                />
                            </div>
                        )}
                    </div>

                    {/* Desktop/Tablet Layout */}
                    <div className="hidden lg:grid lg:grid-cols-3 items-center gap-4">
                        <Link to="/" className="text-2xl font-serif text-[#0A0A0A] hover:opacity-70 transition-opacity justify-self-start">
                            Art Museum
                        </Link>
                        
                        {showSearch && (
                            <div className="justify-self-center max-w-md w-full mx-4">
                                <input
                                    type="text"
                                    placeholder="Search artworks..."
                                    value={searchQuery || ''}
                                    onChange={(e) => onSearchChange?.(e.target.value)}
                                    className="w-full px-0 py-2 text-sm border-b border-neutral-300 focus:border-[#0A0A0A] focus:outline-none bg-transparent text-[#0A0A0A] placeholder:text-neutral-400 font-light"
                                />
                            </div>
                        )}
                        
                        {!showSearch && <div></div>}
                        
                        <nav className="flex items-center gap-4 lg:gap-6 justify-self-end">
                            {user ? (
                                <>
                                    <Link
                                        to="/profile"
                                        className="text-sm text-[#6B7280] hover:text-[#0A0A0A] transition-colors"
                                    >
                                        Saved
                                    </Link>
                                    <span className="text-sm text-[#6B7280] hidden lg:inline">{user.name}</span>
                                    <button
                                        onClick={handleLogout}
                                        className="text-sm text-[#6B7280] hover:text-[#0A0A0A] transition-colors"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => {
                                        setAuthMode('login');
                                        setShowAuthModal(true);
                                    }}
                                    className="text-sm text-[#6B7280] hover:text-[#0A0A0A] transition-colors"
                                >
                                    Login
                                </button>
                            )}
                        </nav>
                    </div>

                </div>
            </header>

            {/* Mobile Drawer Overlay */}
            {showMobileDrawer && (
                <div
                    id="mobile-drawer-overlay"
                    className="fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity duration-300"
                    onClick={() => setShowMobileDrawer(false)}
                />
            )}

            {/* Mobile Drawer */}
            <aside
                id="mobile-drawer"
                className={`fixed top-0 left-0 h-full w-[320px] max-w-[85vw] bg-white border-r border-neutral-200 z-50 lg:hidden transform transition-transform duration-300 ease-out ${
                    showMobileDrawer ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex flex-col justify-between h-full px-6 py-8 overflow-y-auto">
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
                            <h1 className="text-4xl font-serif text-[#0A0A0A] leading-tight mb-6">
                                <span className="block">Art</span>
                                <span className="block">Museum</span>
                            </h1>
                            
                            {/* Dates */}
                            <p className="text-sm text-[#6B7280] font-serif mb-12">
                                The Metropolitan Museum of Art
                            </p>
                            
                            {/* Main Navigation */}
                            <nav className="space-y-2 mb-16">
                                <Link 
                                    to="/" 
                                    className="block text-base text-[#0A0A0A] font-serif hover:opacity-70 transition-opacity underline decoration-1 underline-offset-4"
                                    onClick={() => setShowMobileDrawer(false)}
                                >
                                    Paintings
                                </Link>
                                <Link 
                                    to="/" 
                                    className="block text-base text-[#0A0A0A] font-serif hover:opacity-70 transition-opacity underline decoration-1 underline-offset-4"
                                    onClick={() => setShowMobileDrawer(false)}
                                >
                                    Drawings
                                </Link>
                                <Link 
                                    to="/" 
                                    className="block text-base text-[#0A0A0A] font-serif hover:opacity-70 transition-opacity underline decoration-1 underline-offset-4"
                                    onClick={() => setShowMobileDrawer(false)}
                                >
                                    Sculptures
                                </Link>
                            </nav>
                        </div>
                    </div>

                    {/* Footer Navigation */}
                    <div className="relative z-10">
                        <nav className="mb-6">
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#6B7280] font-serif">
                                <Link to="/" className="hover:text-[#0A0A0A] transition-colors underline decoration-1 underline-offset-4" onClick={() => setShowMobileDrawer(false)}>
                                    Artist
                                </Link>
                                <span className="text-[#6B7280]">,</span>
                                <Link to="/" className="hover:text-[#0A0A0A] transition-colors underline decoration-1 underline-offset-4" onClick={() => setShowMobileDrawer(false)}>
                                    Journal
                                </Link>
                                <span className="text-[#6B7280]">,</span>
                                <Link to="/" className="hover:text-[#0A0A0A] transition-colors underline decoration-1 underline-offset-4" onClick={() => setShowMobileDrawer(false)}>
                                    About
                                </Link>
                                <span className="text-[#6B7280]">,</span>
                                <Link to="/" className="hover:text-[#0A0A0A] transition-colors underline decoration-1 underline-offset-4" onClick={() => setShowMobileDrawer(false)}>
                                    Video
                                </Link>
                                <span className="text-[#6B7280]">,</span>
                                <Link to="/" className="hover:text-[#0A0A0A] transition-colors underline decoration-1 underline-offset-4" onClick={() => setShowMobileDrawer(false)}>
                                    Archive
                                </Link>
                                <span className="text-[#6B7280]">,</span>
                                <Link to="/" className="hover:text-[#0A0A0A] transition-colors underline decoration-1 underline-offset-4" onClick={() => setShowMobileDrawer(false)}>
                                    Contact
                                </Link>
                            </div>
                        </nav>
                        
                        {/* User Auth Section */}
                        {user ? (
                            <div className="mb-4 text-xs text-[#6B7280]">
                                <Link 
                                    to="/profile"
                                    className="hover:text-[#0A0A0A] transition-colors underline decoration-1 underline-offset-4"
                                    onClick={() => setShowMobileDrawer(false)}
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
                                    setShowMobileDrawer(false);
                                }}
                                className="text-xs text-[#6B7280] hover:text-[#0A0A0A] transition-colors underline decoration-1 underline-offset-4"
                            >
                                Login
                            </button>
                        )}
                        
                        {/* Copyright */}
                        <p className="text-xs text-[#6B7280] mt-4">
                            Copyright © 2025 Art Museum
                        </p>
                    </div>
                </div>
            </aside>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                mode={authMode}
                onSwitchMode={(mode) => setAuthMode(mode)}
            />
        </>
    );
}
