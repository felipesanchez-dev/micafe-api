import pino from "pino";
import { Logger } from "../../domain/interfaces/services.interface";
import { randomBytes } from "crypto";

interface LogContext {
  requestId?: string;
  userId?: string;
  service?: string;
  operation?: string;
  duration?: number;
  statusCode?: number;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  cacheHit?: boolean;
  attempt?: number;
  maxAttempts?: number;
  errorCode?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export class PinoLogger implements Logger {
  private logger: pino.Logger;

  constructor(level: string = "info") {
    const isProduction = process.env.NODE_ENV === "production";

    this.logger = pino({
      level,
      name: "MiCafe-API",
      ...(isProduction
        ? {}
        : {
            transport: {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "SYS:HH:MM:ss",
                ignore: "pid,hostname",
                messageFormat:
                  "🕐 {time} | {levelLabel} | ☕ MiCafe-API | {msg}",
              },
            },
          }),
    });
  }

  generateRequestId(): string {
    return randomBytes(4).toString("hex");
  }

  private logWithContext(
    level: "info" | "warn" | "error" | "debug",
    message: string,
    context?: LogContext
  ): void {
    const enrichedContext = {
      service: "MiCafe-API",
      environment: process.env.NODE_ENV || "development",
      ...context,
    };

    this.logger[level](enrichedContext, message);
  }

  info(message: string, context?: LogContext): void {
    this.logWithContext("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.logWithContext("warn", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.logWithContext("error", message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.logWithContext("debug", message, context);
  }

  logSuccess(message: string, statusCode: number = 200, ip?: string): void {
    this.info(
      `✅ ${message} | Status: ${statusCode}${ip ? ` | IP: ${ip}` : ""}`
    );
  }

  logError(
    message: string,
    statusCode: number = 500,
    ip?: string,
    error?: string
  ): void {
    this.error(
      `❌ ${message} | Status: ${statusCode}${ip ? ` | IP: ${ip}` : ""}${
        error ? ` | Error: ${error}` : ""
      }`
    );
  }

  logWarning(message: string, ip?: string, details?: string): void {
    this.warn(
      `⚠️  ${message}${ip ? ` | IP: ${ip}` : ""}${
        details ? ` | ${details}` : ""
      }`
    );
  }

  logRequest(
    method: string,
    path: string,
    ip: string,
    userAgent?: string
  ): void {
    this.info(
      `📥 ${method} ${path} | IP: ${ip}${
        userAgent ? ` | UA: ${userAgent.substring(0, 50)}...` : ""
      }`
    );
  }

  logResponse(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    ip: string
  ): void {
    const status =
      statusCode >= 200 && statusCode < 300
        ? "✅"
        : statusCode >= 400 && statusCode < 500
        ? "⚠️"
        : "❌";
    this.info(
      `📤 ${status} ${method} ${path} | Status: ${statusCode} | ${duration}ms | IP: ${ip}`
    );
  }

  logStartup(port: number, environment: string): void {
    this.info(`🚀 Server started | Port: ${port} | Env: ${environment}`);
  }

  logCacheOperation(operation: "HIT" | "MISS", key: string): void {
    const emoji = operation === "HIT" ? "💾" : "🌐";
    this.info(`${emoji} Cache ${operation} | Key: ${key}`);
  }

  logScrapingStatus(
    status: "START" | "SUCCESS" | "FAILED",
    attempt?: number,
    maxAttempts?: number,
    duration?: number,
    error?: string
  ): void {
    if (status === "START") {
      this.info(
        `🕷️  Scraping started${
          attempt ? ` | Attempt: ${attempt}/${maxAttempts}` : ""
        }`
      );
    } else if (status === "SUCCESS") {
      this.info(
        `✅ Scraping completed successfully${
          duration ? ` | ${duration}ms` : ""
        }`
      );
    } else {
      this.error(
        `❌ Scraping failed${
          attempt ? ` | Attempt: ${attempt}/${maxAttempts}` : ""
        }${error ? ` | Error: ${error}` : ""}`
      );
    }
  }
}
