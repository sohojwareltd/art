# Troubleshooting Guide

## Page appears blank

If you're seeing a blank page at `http://artmuseum.test/`, try the following:

### 1. Check Browser Console
Open your browser's developer tools (F12) and check the Console tab for JavaScript errors.

### 2. Verify Assets are Loading
In the Network tab, verify that:
- `main-*.js` file loads successfully (200 status)
- `app-*.css` file loads successfully (200 status)

### 3. Check if Vite Dev Server is Running (for development)
If you want to use the Vite dev server with hot module replacement:
```bash
npm run dev
```
Then refresh the page.

### 4. Use Built Assets (current setup)
The built assets are in `public/build/`. They should work automatically. If not:
- Clear Laravel cache: `php artisan cache:clear && php artisan config:clear && php artisan view:clear`
- Rebuild assets: `npm run build`

### 5. Verify API Endpoints
Test if the API is working:
```bash
curl http://artmuseum.test/api/artworks?page=1&per_page=1
```

### 6. Check Database Connection
If using database features (saved artworks, auth):
```bash
php artisan migrate
```

### 7. Common Issues

**Issue: "Cannot find module" errors**
- Run: `npm install`
- Rebuild: `npm run build`

**Issue: API returns 500 errors**
- Check Laravel logs: `storage/logs/laravel.log`
- Verify Met Museum API is accessible (no firewall blocking)

**Issue: CSS not loading**
- Verify `public/build/assets/app-*.css` exists
- Check browser Network tab for 404 errors
- Clear browser cache (Ctrl+Shift+R)

### 8. Quick Test
To verify React is mounting, open browser console and type:
```javascript
document.getElementById('app')
```
You should see the div element. If null, there's a problem with the HTML.



