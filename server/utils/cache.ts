import type { H3Event } from "h3";
import { setHeader } from "h3";

/**
 * Sanitize a string to be used as a filename
 * Replaces invalid characters with underscores and removes duplicate underscores
 */
export function sanitizeFilename(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9-\u0600-\u06FF_]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Cache entry structure
 */
interface CacheEntry<T = any> {
  data: T;
  mtime: number; // Timestamp when cache was created
}

/**
 * Get cache entry with stale-while-revalidate pattern
 * @param event - H3 event object
 * @param cacheKey - Cache key (will be sanitized automatically)
 * @param cacheTtl - Time to live in seconds (default: 1 hour)
 * @param fetchFn - Function to fetch fresh data (called when cache is stale or missing)
 * @returns Cached data or fresh data
 */
export async function getCachedData<T>(
  event: H3Event,
  cacheKey: string,
  cacheTtl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const storage = useStorage("db");

  const sanitizedKey = sanitizeFilename(cacheKey);

  try {
    const cachedResponse = (await storage.getItem<CacheEntry<T>>(
      sanitizedKey
    )) as CacheEntry<T> | null;

    if (cachedResponse?.mtime) {
      const age = Date.now() - cachedResponse.mtime;
      const isFresh = age < cacheTtl * 1000;
      const isStale = !isFresh;

      if (isFresh) {
        // Cache is fresh, return immediately
        setHeader(event, "X-Cache-Status", "HIT");
        return cachedResponse.data;
      }

      if (isStale) {
        // Cache is stale, return stale data but refresh in background
        setHeader(event, "X-Cache-Status", "STALE");

        // Trigger background refresh (non-blocking)
        setImmediate(async () => {
          try {
            const freshData = await fetchFn();
            await storage.setItem(sanitizedKey, {
              data: freshData,
              mtime: Date.now(),
            });
          } catch (err) {
            // Silently fail background refresh
            console.error("[Cache] Background refresh failed:", err);
          }
        });

        return cachedResponse.data;
      }
    }
  } catch (error) {
    // If cache read fails, continue to fetch fresh data
    console.error("[Cache] Error reading cache:", error);
  }

  // No cache or cache read failed, fetch fresh data
  try {
    const freshData = await fetchFn();
    setHeader(event, "X-Cache-Status", "MISS");

    // Store in cache
    try {
      await storage.setItem(sanitizedKey, {
        data: freshData,
        mtime: Date.now(),
      });
    } catch (error) {
      // If cache write fails, still return the data
      console.error("[Cache] Error writing cache:", error);
    }

    return freshData;
  } catch (error) {
    // If fetch fails, try to return stale cache if available
    try {
      const cachedResponse = (await storage.getItem<CacheEntry<T>>(
        sanitizedKey
      )) as CacheEntry<T> | null;

      if (cachedResponse?.data) {
        setHeader(event, "X-Cache-Status", "STALE");
        return cachedResponse.data;
      }
    } catch (cacheError) {
      // Ignore cache read errors during error handling
    }

    // Re-throw the original error if no stale cache available
    throw error;
  }
}

/**
 * Set cache entry
 * @param cacheKey - Cache key (will be sanitized automatically)
 * @param data - Data to cache
 * @param ttl - Time to live in seconds (optional, for future use)
 */
export async function setCacheData<T>(
  cacheKey: string,
  data: T,
  ttl?: number
): Promise<void> {
  const storage = useStorage("db");
  const sanitizedKey = sanitizeFilename(cacheKey);

  try {
    await storage.setItem(sanitizedKey, {
      data,
      mtime: Date.now(),
    });
  } catch (error) {
    console.error("[Cache] Error setting cache:", error);
    throw error;
  }
}

/**
 * Get cache entry (simple get, no automatic refresh)
 * @param cacheKey - Cache key (will be sanitized automatically)
 * @returns Cached data or null
 */
export async function getCacheData<T>(
  cacheKey: string
): Promise<CacheEntry<T> | null> {
  const storage = useStorage("db");

  const sanitizedKey = sanitizeFilename(cacheKey);

  try {
    return (await storage.getItem<CacheEntry<T>>(
      sanitizedKey
    )) as CacheEntry<T> | null;
  } catch (error) {
    console.error("[Cache] Error getting cache:", error);
    return null;
  }
}

/**
 * Remove cache entry
 * @param cacheKey - Cache key (will be sanitized automatically)
 */
export async function removeCacheData(cacheKey: string): Promise<void> {
  const storage = useStorage("db");
  const sanitizedKey = sanitizeFilename(cacheKey);

  try {
    await storage.removeItem(sanitizedKey);
  } catch (error) {
    console.error("[Cache] Error removing cache:", error);
    throw error;
  }
}

/**
 * Get all cache keys matching a pattern
 * @param pattern - Pattern to match (prefix pattern, will be sanitized)
 * @returns Array of matching cache keys
 */
export async function getCacheKeys(pattern: string): Promise<string[]> {
  const storage = useStorage("db");
  // For filesystem storage, getKeys with a pattern should work
  // Pattern should be a prefix (e.g., "anarestan:category:")
  try {
    const keys = await storage.getKeys(pattern);
    return keys;
  } catch (error) {
    console.error("[Cache] Error getting cache keys:", error);
    return [];
  }
}

/**
 * Remove all cache entries matching a pattern
 * @param pattern - Pattern to match (prefix pattern, e.g., "anarestan:category:")
 */
export async function removeCacheByPattern(pattern: string): Promise<void> {
  const storage = useStorage("db");
  // For filesystem storage, getKeys with a pattern should work
  // We don't sanitize the pattern here as it's used as a prefix for matching
  try {
    const keys = await storage.getKeys(pattern);
    await Promise.all(keys.map((key) => storage.removeItem(key)));
  } catch (error) {
    console.error("[Cache] Error removing cache by pattern:", error);
    throw error;
  }
}
