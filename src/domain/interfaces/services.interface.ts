import {
  CoffeePriceIndicator,
  ScrapedData,
} from "../entities/coffee-price.entity";
import { IceFuturesHistory } from "../entities/ice-futures.entity";

export interface CoffeePriceRepository {
  scrapeCoffeePrice(): Promise<ScrapedData>;
}

export interface IceFuturesRepository {
  getIceFuturesData(
    timeRange: "1M" | "3M" | "6M" | "1Y"
  ): Promise<IceFuturesHistory>;
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
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, context?: any): void;
  debug(message: string, context?: any): void;

  generateRequestId?(): string;
  logSuccess?(message: string, statusCode?: number, ip?: string): void;
  logError?(
    message: string,
    statusCode?: number,
    ip?: string,
    error?: string
  ): void;
  logWarning?(message: string, ip?: string, details?: string): void;
  logRequest?(
    method: string,
    path: string,
    ip: string,
    userAgent?: string
  ): void;
  logResponse?(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    ip: string
  ): void;
  logStartup?(port: number, environment: string): void;
  logCacheOperation?(operation: "HIT" | "MISS", key: string): void;
  logScrapingStatus?(
    status: "START" | "SUCCESS" | "FAILED",
    attempt?: number,
    maxAttempts?: number,
    duration?: number,
    error?: string
  ): void;
}
