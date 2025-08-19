import dotenv from "dotenv";

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  cacheTtlMs: number;
  scrapingTimeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
  federacionCafeterosUrl: string;
  logLevel: string;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  cacheTtlMs: parseInt(process.env.CACHE_TTL_MS || "300000", 10),
  scrapingTimeoutMs: parseInt(process.env.SCRAPING_TIMEOUT_MS || "10000", 10),
  maxRetries: parseInt(process.env.MAX_RETRIES || "3", 10),
  retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || "1000", 10),
  federacionCafeterosUrl:
    process.env.FEDERACION_CAFETEROS_URL || "https://federaciondecafeteros.org",
  logLevel: process.env.LOG_LEVEL || "info",
};
