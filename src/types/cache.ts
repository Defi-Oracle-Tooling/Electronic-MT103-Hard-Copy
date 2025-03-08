export interface CacheConfig {
  ttl: number;
  maxSize: number;
  policy: 'lru' | 'lfu' | 'fifo';
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  lastEvictionTime?: Date;
  evictionCount: number;
  hitRate: number;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  expires: number;
  lastAccessed: number;
  accessCount: number;
}
