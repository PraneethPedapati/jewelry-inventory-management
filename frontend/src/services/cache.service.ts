// Cache service for client-side data caching
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

interface CacheMetadata {
  version: string;
  lastUpdated: number;
}

const CACHE_VERSION = '1.0.0';
const CACHE_KEYS = {
  DASHBOARD_WIDGETS: 'dashboard_widgets',
  ANALYTICS_DATA: 'analytics_data',
  ANALYTICS_STATUS: 'analytics_status'
} as const;

const CACHE_DURATIONS = {
  DASHBOARD_WIDGETS: 2 * 60 * 60 * 1000, // 2 hours
  ANALYTICS_DATA: 2 * 60 * 60 * 1000, // 2 hours
  ANALYTICS_STATUS: 30 * 60 * 1000 // 30 minutes
} as const;

export class CacheService {
  private static isAvailable(): boolean {
    try {
      const test = '__cache_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private static getCacheKey(key: keyof typeof CACHE_KEYS): string {
    return `inventory_app_${CACHE_KEYS[key]}`;
  }

  static get<T>(key: keyof typeof CACHE_KEYS): T | null {
    if (!this.isAvailable()) return null;

    try {
      const cacheKey = this.getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      const duration = CACHE_DURATIONS[key];

      // Check if cache is expired
      if (Date.now() - entry.timestamp > duration) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Check version compatibility
      if (entry.version !== CACHE_VERSION) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      console.log(`📊 Using cached ${key} data`);
      return entry.data;
    } catch (error) {
      console.warn('Cache retrieval failed:', error);
      return null;
    }
  }

  static set<T>(key: keyof typeof CACHE_KEYS, data: T): void {
    if (!this.isAvailable()) return;

    try {
      const cacheKey = this.getCacheKey(key);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION
      };

      localStorage.setItem(cacheKey, JSON.stringify(entry));
      console.log(`💾 Cached ${key} data`);
    } catch (error) {
      console.warn('Cache storage failed:', error);
    }
  }

  static clear(key: keyof typeof CACHE_KEYS): void {
    if (!this.isAvailable()) return;

    try {
      const cacheKey = this.getCacheKey(key);
      localStorage.removeItem(cacheKey);
      console.log(`🗑️ Cleared ${key} cache`);
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  }

  static clearAll(): void {
    if (!this.isAvailable()) return;

    try {
      Object.keys(CACHE_KEYS).forEach(key => {
        this.clear(key as keyof typeof CACHE_KEYS);
      });
      console.log('🧹 Cleared all cache');
    } catch (error) {
      console.warn('Cache clear all failed:', error);
    }
  }

  static getCacheAge(key: keyof typeof CACHE_KEYS): number | null {
    if (!this.isAvailable()) return null;

    try {
      const cacheKey = this.getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) return null;

      const entry: CacheEntry<any> = JSON.parse(cached);
      return Date.now() - entry.timestamp;
    } catch {
      return null;
    }
  }

  static isStale(key: keyof typeof CACHE_KEYS): boolean {
    const age = this.getCacheAge(key);
    if (age === null) return true;

    const duration = CACHE_DURATIONS[key];
    return age > duration;
  }

  static getCacheStatus(key: keyof typeof CACHE_KEYS) {
    const age = this.getCacheAge(key);
    const isStale = this.isStale(key);

    return {
      hasCache: age !== null,
      age,
      isStale,
      lastUpdated: age ? new Date(Date.now() - age) : null
    };
  }

  // Development debug method
  static debug(): void {
    if (process.env.NODE_ENV !== 'development') return;

    console.group('🔍 Cache Debug Info');
    console.log('Cache Version:', CACHE_VERSION);
    console.log('localStorage Available:', this.isAvailable());

    Object.keys(CACHE_KEYS).forEach(key => {
      const status = this.getCacheStatus(key as keyof typeof CACHE_KEYS);
      console.log(`${key}:`, status);
    });

    console.groupEnd();
  }
} 
