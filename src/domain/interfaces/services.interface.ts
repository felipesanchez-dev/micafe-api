import {
  CoffeePriceIndicator,
  ScrapedData,
} from "../entities/coffee-price.entity";

export interface CoffeePriceRepository {
  scrapeCoffeePrice(): Promise<ScrapedData>;
}

export interface CoffeePriceService {
  getCoffeePriceToday(): Promise<CoffeePriceIndicator>;
}

export interface CacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlMs?: number): void;
  clear(): void;
  getStats?(): { size: number; keys: string[] };
}

export interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}
