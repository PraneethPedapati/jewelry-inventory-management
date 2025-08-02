// Cache service for client-side data caching with persistent storage
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  source: 'memory' | 'localStorage';
}

export class CacheService {
  private static memoryCache = new Map<string, CacheEntry<any>>();
  static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly PERSISTENT_KEYS = [
    'DASHBOARD_WIDGETS',
    'ANALYTICS_DATA',
    'ANALYTICS_STATUS',
    'PRODUCTS_LIST',
    'ORDERS_LIST',
    'EXPENSES_LIST'
  ];

  static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL, persistent: boolean = false): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      source: persistent ? 'localStorage' : 'memory'
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Store in localStorage if persistent
    if (persistent && this.PERSISTENT_KEYS.includes(key)) {
      try {
        const storageEntry = {
          ...entry,
          data: JSON.stringify(data) // Serialize data for localStorage
        };
        localStorage.setItem(`cache_${key}`, JSON.stringify(storageEntry));
      } catch (error) {
        console.warn('Failed to store data in localStorage:', error);
      }
    }
  }

  static get<T>(key: string): T | null {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key) as CacheEntry<T>;

    if (memoryEntry) {
      const isExpired = Date.now() - memoryEntry.timestamp > memoryEntry.ttl;

      if (isExpired) {
        this.memoryCache.delete(key);
        this.clearPersistent(key);
        return null;
      }

      return memoryEntry.data;
    }

    // Check localStorage for persistent keys
    if (this.PERSISTENT_KEYS.includes(key)) {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored);
          const isExpired = Date.now() - entry.timestamp > entry.ttl;

          if (isExpired) {
            this.clearPersistent(key);
            return null;
          }

          // Deserialize data and store in memory cache
          const data = JSON.parse(entry.data as any);
          const memoryEntry: CacheEntry<T> = {
            data,
            timestamp: entry.timestamp,
            ttl: entry.ttl,
            source: 'localStorage'
          };
          this.memoryCache.set(key, memoryEntry);

          return data;
        }
      } catch (error) {
        console.warn('Failed to retrieve data from localStorage:', error);
        this.clearPersistent(key);
      }
    }

    return null;
  }

  static clear(key?: string): void {
    if (key) {
      this.memoryCache.delete(key);
      this.clearPersistent(key);
    } else {
      this.memoryCache.clear();
      this.clearAllPersistent();
    }
  }

  static clearPersistent(key: string): void {
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Failed to clear persistent cache:', error);
    }
  }

  static clearAllPersistent(): void {
    try {
      // Clear all cache keys from localStorage
      this.PERSISTENT_KEYS.forEach(key => {
        localStorage.removeItem(`cache_${key}`);
      });
    } catch (error) {
      console.warn('Failed to clear all persistent cache:', error);
    }
  }

  static getCacheStatus(key: string): {
    hasCache: boolean;
    isStale: boolean;
    age: number;
    lastUpdated: Date | null;
    source: 'memory' | 'localStorage' | null;
  } {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);

    if (memoryEntry) {
      const age = Date.now() - memoryEntry.timestamp;
      const isStale = age > memoryEntry.ttl;

      return {
        hasCache: true,
        isStale,
        age,
        lastUpdated: new Date(memoryEntry.timestamp),
        source: memoryEntry.source
      };
    }

    // Check localStorage for persistent keys
    if (this.PERSISTENT_KEYS.includes(key)) {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          const entry: CacheEntry<any> = JSON.parse(stored);
          const age = Date.now() - entry.timestamp;
          const isStale = age > entry.ttl;

          return {
            hasCache: true,
            isStale,
            age,
            lastUpdated: new Date(entry.timestamp),
            source: entry.source
          };
        }
      } catch (error) {
        console.warn('Failed to check persistent cache status:', error);
      }
    }

    return {
      hasCache: false,
      isStale: false,
      age: 0,
      lastUpdated: null,
      source: null
    };
  }

  static isPersistentKey(key: string): boolean {
    return this.PERSISTENT_KEYS.includes(key);
  }

  // Clear all cache on hard reload (page refresh)
  static clearOnHardReload(): void {
    // This method can be called when we detect a hard reload
    // For now, we'll keep persistent cache across soft navigations
    // but clear it on hard reload by checking for a special flag
    const isHardReload = !window.performance.getEntriesByType('navigation')[0] ||
      (window.performance.getEntriesByType('navigation')[0] as any).type === 'reload';

    if (isHardReload) {
      console.log('🔄 Hard reload detected, clearing persistent cache');
      this.clearAllPersistent();
    }
  }

  // Cache invalidation methods for data changes
  static invalidateOnDataChange(changeType: 'product' | 'order' | 'expense' | 'analytics'): void {
    console.log(`🔄 Invalidating cache due to ${changeType} change`);

    switch (changeType) {
      case 'product':
        this.clear('PRODUCTS_LIST');
        this.clear('DASHBOARD_WIDGETS'); // Products affect dashboard widgets
        break;
      case 'order':
        this.clear('ORDERS_LIST');
        this.clear('DASHBOARD_WIDGETS'); // Orders affect dashboard widgets
        this.clear('ANALYTICS_DATA'); // Orders affect analytics
        break;
      case 'expense':
        this.clear('EXPENSES_LIST');
        this.clear('DASHBOARD_WIDGETS'); // Expenses affect dashboard widgets
        this.clear('ANALYTICS_DATA'); // Expenses affect analytics
        break;
      case 'analytics':
        this.clear('ANALYTICS_DATA');
        this.clear('ANALYTICS_STATUS');
        break;
    }
  }

  // Get cache statistics for debugging
  static getCacheStats(): {
    memoryCacheSize: number;
    persistentKeys: string[];
    totalPersistentSize: number;
  } {
    let totalPersistentSize = 0;
    const persistentKeys: string[] = [];

    this.PERSISTENT_KEYS.forEach(key => {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          persistentKeys.push(key);
          totalPersistentSize += stored.length;
        }
      } catch (error) {
        console.warn('Failed to get cache stats for key:', key, error);
      }
    });

    return {
      memoryCacheSize: this.memoryCache.size,
      persistentKeys,
      totalPersistentSize
    };
  }
} 
