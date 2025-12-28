# Art Museum Application - Setup Guide

## Overview
A production-ready art browsing platform built with Laravel 12 (API) and React (Vite) featuring:
- Met Museum API integration
- User authentication with Laravel Sanctum (SPA)
- Save/unsave artworks functionality
- Minimal, editorial design inspired by gallery-style UIs

## Backend Setup

1. **Install Dependencies**
   ```bash
   composer install
   ```

2. **Environment Configuration**
   Update your `.env` file with:
   ```env
   APP_NAME="Art Museum"
   APP_URL=http://localhost:8000
   
   # Database configuration
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=artmuseum
   DB_USERNAME=root
   DB_PASSWORD=
   
   # Session driver for Sanctum SPA
   SESSION_DRIVER=cookie
   SESSION_DOMAIN=localhost
   
   # Sanctum configuration (optional, defaults are set)
   SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:8000
   ```

3. **Run Migrations**
   ```bash
   php artisan migrate
   ```

4. **Start Laravel Server**
   ```bash
   php artisan serve
   ```

## Frontend Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Vite Dev Server**
   ```bash
   npm run dev
   ```

   Or use the combined dev command:
   ```bash
   npm run dev
   ```
   (In a separate terminal, run `php artisan serve`)

## Application Structure

### Backend (Laravel)
- **Routes**: `routes/api.php` - All API endpoints
- **Controllers**: `app/Http/Controllers/Api/` - Auth, Artwork, SavedArtwork, User
- **Services**: `app/Services/MetMuseumService.php` - Met Museum API integration
- **Models**: `app/Models/` - User, SavedArtwork

### Frontend (React)
- **Entry**: `resources/js/main.jsx`
- **Pages**: `resources/js/pages/` - Home, ArtworkDetail, Profile
- **Components**: 
  - `resources/js/components/layout/` - Layout, Header, AuthModal
  - `resources/js/components/artwork/` - GalleryGrid, ArtworkCard, ArtworkDetail
  - `resources/js/components/ui/` - Image, Skeleton
- **Hooks**: `resources/js/hooks/useArtworks.js` - TanStack Query hooks
- **Context**: `resources/js/contexts/AuthContext.jsx` - Authentication state

## API Endpoints

### Public
- `GET /api/artworks` - List artworks (paginated)
- `GET /api/artworks/{id}` - Get artwork details
- `GET /api/search?q={query}` - Search artworks
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Protected (requires authentication)
- `POST /api/auth/logout` - Logout user
- `GET /api/user` - Get current user
- `POST /api/artworks/{id}/save` - Save artwork
- `DELETE /api/artworks/{id}/save` - Unsave artwork
- `GET /api/user/saved` - Get user's saved artworks

## Features

1. **Home Page**
   - Full-viewport hero section with featured artwork
   - Infinite scroll masonry grid
   - Search functionality

2. **Artwork Detail**
   - Fullscreen artwork view
   - Minimal metadata overlay
   - Save/Unsave button (authenticated users)

3. **Profile Page**
   - Grid of saved artworks
   - User authentication required

4. **Authentication**
   - Modal-based login/register
   - Cookie-based SPA authentication (Sanctum)

## Design System

- **Typography**: Playfair Display (serif headings), Inter (sans-serif body)
- **Colors**: Off-white (#FAFAF9), Near-black (#0A0A0A), Muted gray (#6B7280)
- **Spacing**: Generous whitespace, editorial layout
- **Animations**: Framer Motion for smooth transitions

## Notes

- Artworks are cached for 5 minutes to reduce API calls
- Images use lazy loading with skeleton placeholders
- Responsive design (desktop-first approach)
- No mock data - all data comes from Met Museum API

