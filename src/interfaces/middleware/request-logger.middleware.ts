import { Request, Response, NextFunction } from "express";
import { Logger } from "../../domain/interfaces/services.interface";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
    startTime?: number;
    context?: {
      requestId: string;
      startTime: number;
      ip: string;
      userAgent: string;
    };
  }
}

export class RequestLoggerMiddleware {
  constructor(private readonly logger: Logger) {}

  logIncoming = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const requestId =
      this.logger.generateRequestId?.() || this.generateFallbackId();

    req.requestId = requestId;
    req.startTime = startTime;
    req.context = {
      requestId,
      startTime,
      ip: req.ip || req.connection.remoteAddress || "unknown",
      userAgent: req.get("User-Agent") || "unknown",
    };

    next();
  };

  logOutgoing = (req: Request, res: Response, next: NextFunction): void => {
    const logger = this.logger;
    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function (this: Response, body: any) {
      const duration = Date.now() - (req.startTime || 0);
      const ip = req.context?.ip || req.ip || "unknown";

      logger.logResponse?.(req.method, req.path, res.statusCode, duration, ip);

      return originalSend.call(this, body);
    };

    res.json = function (this: Response, body: any) {
      const duration = Date.now() - (req.startTime || 0);
      const ip = req.context?.ip || req.ip || "unknown";

      logger.logResponse?.(req.method, req.path, res.statusCode, duration, ip);

      return originalJson.call(this, body);
    };

    next();
  };

  private generateFallbackId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}
