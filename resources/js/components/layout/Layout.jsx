import Header from './Header';

export default function Layout({ children, searchQuery, onSearchChange }) {
    return (
        <div className="min-h-screen">
            <Header searchQuery={searchQuery} onSearchChange={onSearchChange} />
            <main>{children}</main>
        </div>
    );
}

