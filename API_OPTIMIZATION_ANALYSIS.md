# Met Museum API Optimization Analysis

Based on the [Met Museum API documentation](https://metmuseum.github.io/), here's the analysis and recommendations for optimal performance.

## Current Implementation Analysis

### ✅ What's Working Well

1. **Using `/search` endpoint instead of `/objects`** - Correct approach, avoids fetching 471k+ object IDs
2. **Caching (1 hour TTL)** - Reduces API calls significantly
3. **Prefetching 3 pages ahead** - Improves perceived performance
4. **Image caching service** - Reduces bandwidth and improves load times
5. **Infinite scroll with TanStack Query** - Good UX pattern

### ⚠️ Current Issues & Optimizations Needed

#### 1. **Inefficient Image Filtering**
- **Current**: Fetching 60 IDs to get 20 with images (3x multiplier)
- **Problem**: The `hasImages=true` filter should already filter results, but we're still checking manually
- **Root Cause**: Even with `hasImages=true`, some objects may not have `primaryImage` set
- **Solution**: Keep the filtering but reduce multiplier (2x instead of 3x), or implement better caching strategy

#### 2. **Large Search Result Set**
- **Current**: Using `q=*` with `hasImages=true` returns ~20k+ object IDs
- **Issue**: Caching this large array and slicing it repeatedly
- **Better Approach**: 
  - Option A: Use `isHighlight=true` for a curated "Featured" view (smaller, quality set)
  - Option B: Cache objectIDs list separately with longer TTL (24 hours)
  - Option C: Use department filtering to break collection into smaller chunks

#### 3. **Missing API Features**
- Not using `isHighlight=true` for featured artworks
- No department filtering (`departmentId` parameter)
- No date range filtering (`dateBegin`/`dateEnd`)
- No medium filtering (`medium` parameter)

## Recommended Optimizations

### Strategy 1: Separate ObjectIDs Caching (Recommended)

```php
// Cache the objectIDs list separately with longer TTL
$objectIDsCacheKey = "met_objectIDs_hasImages";
$objectIDs = Cache::remember($objectIDsCacheKey, 86400, function() {
    // Fetch once per day
    return $this->fetchObjectIDs(['hasImages' => true]);
});

// Then paginate from cached list
$paginatedIDs = array_slice($objectIDs, $skip, $perPage);
```

**Benefits:**
- Fetch objectIDs list once per day instead of per page
- Much faster pagination (just array slicing)
- Still cache artwork details per page

### Strategy 2: Use Highlights for Homepage

```php
// For main browse, use highlights (curated, quality artworks)
$response = Http::get(self::BASE_URL . '/search', [
    'isHighlight' => true,
    'hasImages' => true,
]);
```

**Benefits:**
- Smaller, curated set (~1,000-2,000 objects)
- Higher quality artworks
- Faster initial load
- Better UX for casual browsing

### Strategy 3: Reduce fetchArtworkDetails Multiplier

Since `hasImages=true` should filter most objects without images:
- Change from 3x (60 attempts) to 2x (40 attempts)
- This reduces API calls by 33%
- Still enough buffer for edge cases

### Strategy 4: Implement Department Filtering

Add department filtering for better UX:
- Users can browse by department (Paintings, Sculpture, etc.)
- Smaller result sets = faster queries
- More targeted browsing experience

## Performance Metrics

### Current Approach
- Initial search: ~1-2 seconds (fetching 20k+ object IDs)
- Per page: ~15-30 seconds (fetching 60 artwork details, many without images)
- Cache hit: ~50ms

### Optimized Approach (Highlights)
- Initial search: ~500ms (fetching ~1k-2k highlights)
- Per page: ~5-10 seconds (fetching 30-40 artwork details)
- Cache hit: ~50ms

### Optimized Approach (Cached ObjectIDs)
- Initial search (day 1): ~1-2 seconds
- Initial search (subsequent): ~50ms (from cache)
- Per page: ~5-10 seconds
- Cache hit: ~50ms

## Implementation Priority

1. **High Priority**: Reduce fetchArtworkDetails multiplier (2x instead of 3x)
2. **High Priority**: Cache objectIDs separately with 24h TTL
3. **Medium Priority**: Add `isHighlight=true` option for featured browsing
4. **Medium Priority**: Implement department filtering
5. **Low Priority**: Add date range and medium filtering

## Rate Limit Considerations

- API limit: 80 requests/second
- Current: ~60 requests per page (20 artworks × 3x multiplier)
- With 2x multiplier: ~40 requests per page
- With prefetching 3 pages: ~120 requests when loading new pages
- **Recommendation**: Add rate limiting/throttling to stay under 80 req/s

## Best Practices from API Docs

1. ✅ Use `/search` endpoint (not `/objects`)
2. ✅ Use `hasImages=true` filter
3. ✅ Implement proper caching
4. ✅ Respect rate limits (80 req/s)
5. ⚠️ Consider using highlights for curated experience
6. ⚠️ Use department filtering for targeted browsing
7. ⚠️ Implement error handling for API failures

