# Artwork Cache Command Usage

## Overview

The `artworks:cache` command pre-warms the cache by fetching and caching artworks. It caches the first N artworks immediately (default: 100) and queues the rest for background processing.

## Basic Usage

```bash
# Cache first 100 artworks immediately, queue the rest
php artisan artworks:cache

# Cache first 200 artworks immediately
php artisan artworks:cache --first=200

# Cache with custom page size
php artisan artworks:cache --first=100 --per-page=20

# Only queue background jobs (skip immediate caching)
php artisan artworks:cache --background
```

## How It Works

1. **Fetches Object IDs**: Gets the list of all artwork IDs with images from the Met Museum API (cached for 24 hours)

2. **Immediate Caching**: Caches the first N artworks (default: 100) synchronously
   - Shows progress bar
   - Each page is cached via `MetMuseumService::getObjects()`
   - Ensures the most commonly accessed artworks are ready immediately

3. **Background Processing**: Queues remaining pages as background jobs
   - Each page is processed as a separate job
   - Jobs are stored in the `jobs` table
   - Process jobs with `php artisan queue:work`

## Processing Background Jobs

After running the command, process the queued jobs:

```bash
# Process jobs one at a time
php artisan queue:work

# Process jobs continuously (recommended for production)
php artisan queue:work --daemon

# Process with specific connection
php artisan queue:work --connection=database
```

## Example Output

```
Starting artwork caching process...
First 100 artworks will be cached immediately
Remaining artworks will be queued for background processing
Fetching object IDs list from API...
Total artworks: 20406
Total pages: 1021
First pages to cache: 5

Caching first 5 pages immediately...
 5/5 [████████████████████████████] 100%

✓ Cached first 5 pages (100 artworks)

Queueing 1016 pages for background processing...
1016/1016 [████████████████████████████] 100%

✓ Queued 1016 pages for background processing

Cache warming complete!
Run 'php artisan queue:work' to process background jobs
```

## Scheduling (Optional)

Add to `app/Console/Kernel.php` to run automatically:

```php
protected function schedule(Schedule $schedule)
{
    // Run daily at 2 AM to refresh cache
    $schedule->command('artworks:cache --first=100')
             ->dailyAt('02:00');
}
```

## Performance Notes

- **First 100 artworks**: Cached immediately (~2-5 minutes depending on API speed)
- **Remaining artworks**: Processed in background, doesn't block the command
- **Cache TTL**: Artwork pages cached for 1 hour, object IDs list for 24 hours
- **Rate Limiting**: Jobs automatically retry on failure (up to 3 attempts)

## Troubleshooting

If jobs fail to process:
1. Check queue connection: `php artisan queue:work --verbose`
2. Check failed jobs: `php artisan queue:failed`
3. Retry failed jobs: `php artisan queue:retry all`
4. Clear failed jobs: `php artisan queue:flush`

