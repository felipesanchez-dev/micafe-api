import { Request, Response, NextFunction } from "express";
import { AppError } from "../../domain/errors/app.errors";
import { Logger } from "../../domain/interfaces/services.interface";

export class ErrorMiddleware {
  constructor(private readonly logger: Logger) {}

  handle = (
    error: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
  ): void => {
    const requestId = (req as any).requestId || "unknown";
    const duration = Date.now() - ((req as any).startTime || 0);

    this.logger.error("Unhandled server error occurred", {
      operation: "UNHANDLED_ERROR",
      requestId,
      duration,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      body: req.body ? JSON.stringify(req.body).substring(0, 500) : undefined,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      params: Object.keys(req.params).length > 0 ? req.params : undefined,
    });

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: {
          code: error.code,
          detail: error.detail,
        },
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        author: "Juan Felipe Reyes Sanchez",
        github: "https://github.com/felipesanchez-dev",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: {
          code: "INTERNAL_ERROR",
          detail: error.message,
        },
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        author: "Juan Felipe Reyes Sanchez",
        github: "https://github.com/felipesanchez-dev",
      });
    }
  };

  notFound = (req: Request, res: Response): void => {
    const requestId = (req as any).requestId || "unknown";
    const duration = Date.now() - ((req as any).startTime || 0);

    this.logger.warn("Endpoint not found - 404 error", {
      operation: "NOT_FOUND_ERROR",
      requestId,
      duration,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
    });

    res.status(404).json({
      success: false,
      message: "Endpoint not found",
      error: {
        code: "NOT_FOUND",
        detail: `The requested endpoint ${req.method} ${req.path} does not exist`,
      },
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      author: "Juan Felipe Reyes Sanchez",
      github: "https://github.com/felipesanchez-dev",
    });
  };
}
