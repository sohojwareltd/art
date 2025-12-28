import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import ArtworkDetail from './pages/ArtworkDetail';
import Profile from './pages/Profile';

function App() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <AuthProvider>
            <Layout searchQuery={searchQuery} onSearchChange={setSearchQuery}>
                <Routes>
                    <Route path="/" element={<Home searchQuery={searchQuery} />} />
                    <Route path="/artwork/:id" element={<ArtworkDetail />} />
                    <Route path="/profile" element={<Profile />} />
                </Routes>
            </Layout>
        </AuthProvider>
    );
}

export default App;

