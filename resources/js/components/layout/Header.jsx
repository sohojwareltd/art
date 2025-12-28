import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';
import { useState } from 'react';

export default function Header({ searchQuery, onSearchChange }) {
    const { user, logout } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const location = useLocation();
    const showSearch = location.pathname === '/';

    const handleLogout = async () => {
        await logout();
        setShowMobileMenu(false);
    };

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAF9]/80 backdrop-blur-sm border-b border-neutral-200/50">
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-12 py-4 md:py-6">
                    {/* Mobile Layout */}
                    <div className="flex md:hidden items-center justify-between gap-4">
                        <Link 
                            to="/" 
                            className="text-xl font-serif text-[#0A0A0A] hover:opacity-70 transition-opacity"
                            onClick={() => setShowMobileMenu(false)}
                        >
                            Art Museum
                        </Link>
                        
                        {showSearch && (
                            <div className="flex-1 max-w-xs">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery || ''}
                                    onChange={(e) => onSearchChange?.(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:border-[#0A0A0A] focus:outline-none bg-white text-[#0A0A0A] placeholder:text-neutral-400 font-light"
                                />
                            </div>
                        )}
                        
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="text-[#0A0A0A] p-2"
                            aria-label="Menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {showMobileMenu ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid md:grid-cols-3 items-center gap-4">
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

                    {/* Mobile Menu */}
                    {showMobileMenu && (
                        <div className="md:hidden mt-4 pt-4 border-t border-neutral-200">
                            <nav className="flex flex-col gap-4">
                                {user ? (
                                    <>
                                        <Link
                                            to="/profile"
                                            className="text-sm text-[#6B7280] hover:text-[#0A0A0A] transition-colors py-2"
                                            onClick={() => setShowMobileMenu(false)}
                                        >
                                            Saved
                                        </Link>
                                        <div className="text-sm text-[#6B7280] py-2">
                                            {user.name}
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="text-sm text-[#6B7280] hover:text-[#0A0A0A] transition-colors text-left py-2"
                                        >
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setAuthMode('login');
                                            setShowAuthModal(true);
                                            setShowMobileMenu(false);
                                        }}
                                        className="text-sm text-[#6B7280] hover:text-[#0A0A0A] transition-colors text-left py-2"
                                    >
                                        Login
                                    </button>
                                )}
                            </nav>
                        </div>
                    )}
                </div>
            </header>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                mode={authMode}
                onSwitchMode={(mode) => setAuthMode(mode)}
            />
        </>
    );
}
