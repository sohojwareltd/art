import Header from './Header';
import Sidebar from './Sidebar';
import CursorFollower from '../ui/CursorFollower';

export default function Layout({ children, searchQuery, onSearchChange }) {
    return (
        <div className="min-h-screen">
            <CursorFollower />
            {/* Header - Mobile and Tablet only */}
            <div className="lg:hidden">
                <Header searchQuery={searchQuery} onSearchChange={onSearchChange} />
            </div>
            {/* Sidebar - Desktop only */}
            <Sidebar />
            <main>{children}</main>
        </div>
    );
}

