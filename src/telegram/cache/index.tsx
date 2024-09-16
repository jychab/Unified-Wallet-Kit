const CACHE_VERSION = 'v1.0'; // Change this version when the cache structure changes

export class PersistentCache {
  private cache: Record<string, { data: any; expiry: number; version: string }> = {};
  private storageKey = 'persistent-cache';
  private isBrowser: boolean;

  constructor(private defaultTtl: number = 60000) {
    this.isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    if (this.isBrowser) {
      this.loadCacheFromStorage();
    }
  }

  // Load cache from localStorage
  private loadCacheFromStorage() {
    const storedCache = localStorage.getItem(this.storageKey);
    if (storedCache) {
      try {
        const parsedCache = JSON.parse(storedCache);

        // Invalidate cache if the version changes
        this.cache = Object.keys(parsedCache).reduce(
          (validCache, key) => {
            if (parsedCache[key].version === CACHE_VERSION) {
              validCache[key] = parsedCache[key];
            }
            return validCache;
          },
          {} as Record<string, { data: any; expiry: number; version: string }>,
        );

        this.cleanupExpiredItems();
      } catch (e) {
        console.error('Failed to load cache from localStorage', e);
      }
    }
  }

  // Save cache to localStorage
  private saveCacheToStorage() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.cache));
  }

  // Set cache with a version and optional TTL
  set(key: string, data: any, ttl: number = this.defaultTtl): void {
    const expiry = Date.now() + ttl;
    this.cache[key] = { data, expiry, version: CACHE_VERSION };
    this.saveCacheToStorage();
  }

  // Get data from cache if it exists and is not expired
  get(key: string): any | null {
    const cached = this.cache[key];

    if (!cached || cached.version !== CACHE_VERSION) {
      return null;
    }

    if (Date.now() > cached.expiry) {
      this.clear(key);
      return null;
    }

    return cached.data;
  }

  clear(key?: string): void {
    if (key) {
      delete this.cache[key];
    } else {
      this.cache = {};
    }
    this.saveCacheToStorage();
  }

  private cleanupExpiredItems() {
    Object.keys(this.cache).forEach((key) => {
      if (Date.now() > this.cache[key].expiry) {
        delete this.cache[key];
      }
    });
    this.saveCacheToStorage();
  }
}
