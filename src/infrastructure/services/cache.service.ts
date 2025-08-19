import { CacheService } from "../../domain/interfaces/services.interface";

interface CacheItem<T> {
  data: T;
  expiresAt: number;
}

export class InMemoryCacheService implements CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTtlMs: number;

  constructor(defaultTtlMs: number = 300000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTtlMs;
    const expiresAt = Date.now() + ttl;

    this.cache.set(key, {
      data: value,
      expiresAt,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    this.cleanExpired();
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
