import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthModal({ isOpen, onClose, mode: initialMode, onSwitchMode }) {
    const [mode, setMode] = useState(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'login') {
                await login(email, password);
                onClose();
                setEmail('');
                setPassword('');
            } else {
                if (password !== passwordConfirmation) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }
                await register(name, email, password, passwordConfirmation);
                onClose();
                setName('');
                setEmail('');
                setPassword('');
                setPasswordConfirmation('');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        const newMode = mode === 'login' ? 'register' : 'login';
        setMode(newMode);
        onSwitchMode(newMode);
        setError('');
        setEmail('');
        setPassword('');
        setName('');
        setPasswordConfirmation('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4 sm:p-6 pointer-events-none"
                    >
                        <div 
                            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto pointer-events-auto relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-[#6B7280] hover:text-[#0A0A0A] transition-colors p-1"
                                aria-label="Close"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <h2 className="text-2xl sm:text-3xl font-serif mb-4 sm:mb-6 text-[#0A0A0A] pr-8">
                                {mode === 'login' ? 'Login' : 'Register'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                                {mode === 'register' && (
                                    <div>
                                        <label className="block text-xs sm:text-sm text-[#6B7280] mb-1.5 sm:mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] touch-manipulation"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs sm:text-sm text-[#6B7280] mb-1.5 sm:mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] touch-manipulation"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm text-[#6B7280] mb-1.5 sm:mb-2">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] touch-manipulation"
                                    />
                                </div>

                                {mode === 'register' && (
                                    <div>
                                        <label className="block text-xs sm:text-sm text-[#6B7280] mb-1.5 sm:mb-2">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={passwordConfirmation}
                                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                                            required
                                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] touch-manipulation"
                                        />
                                    </div>
                                )}

                                {error && (
                                    <div className="text-xs sm:text-sm text-red-600">{error}</div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#0A0A0A] text-white py-2.5 sm:py-3 rounded hover:bg-[#1a1a1a] active:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation min-h-[44px]"
                                >
                                    {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
                                </button>
                            </form>

                            <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-[#6B7280]">
                                {mode === 'login' ? (
                                    <>
                                        Don't have an account?{' '}
                                        <button
                                            onClick={switchMode}
                                            className="text-[#0A0A0A] hover:underline active:underline touch-manipulation"
                                        >
                                            Register
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{' '}
                                        <button
                                            onClick={switchMode}
                                            className="text-[#0A0A0A] hover:underline active:underline touch-manipulation"
                                        >
                                            Login
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
