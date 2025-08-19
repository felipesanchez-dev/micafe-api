import { Request, Response, NextFunction } from "express";
import { AppError } from "../../domain/errors/app.errors";
import { Logger } from "../../domain/interfaces/services.interface";

export class ErrorMiddleware {
  constructor(private readonly logger: Logger) {}

  handle = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.logger.error("Unhandled error:", {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
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
    res.status(404).json({
      success: false,
      message: "Endpoint not found",
      error: {
        code: "NOT_FOUND",
        detail: `Path ${req.path} not found`,
      },
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      author: "Juan Felipe Reyes Sanchez",
      github: "https://github.com/felipesanchez-dev",
    });
  };
}
