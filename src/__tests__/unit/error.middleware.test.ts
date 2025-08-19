import { Request, Response, NextFunction } from "express";
import { ErrorMiddleware } from "../../interfaces/middleware/error.middleware";
import {
  AppError,
  ScrapingError,
  ValidationError,
} from "../../domain/errors/app.errors";
import { Logger } from "../../domain/interfaces/services.interface";

describe("ErrorMiddleware", () => {
  let errorMiddleware: ErrorMiddleware;
  let mockLogger: jest.Mocked<Logger>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      path: "/test-path",
      method: "GET",
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();

    errorMiddleware = new ErrorMiddleware(mockLogger);
  });

  describe("handle", () => {
    beforeEach(() => {
      jest
        .spyOn(Date.prototype, "toISOString")
        .mockReturnValue("2023-01-01T00:00:00.000Z");
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should handle AppError correctly", () => {
      const appError = new AppError(
        "Test app error",
        "TEST_ERROR",
        400,
        "Test detail"
      );

      errorMiddleware.handle(
        appError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.error).toHaveBeenCalledWith("Unhandled error:", {
        error: "Test app error",
        stack: appError.stack,
        path: "/test-path",
        method: "GET",
      });

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Test app error",
        error: {
          code: "TEST_ERROR",
          detail: "Test detail",
        },
        timestamp: "2023-01-01T00:00:00.000Z",
        version: "1.0.0",
        author: "Juan Felipe Reyes Sanchez",
        github: "https://github.com/felipesanchez-dev",
      });
    });

    it("should handle ScrapingError correctly", () => {
      const scrapingError = new ScrapingError(
        "Scraping failed",
        "Network timeout"
      );

      errorMiddleware.handle(
        scrapingError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Scraping failed",
        error: {
          code: "SCRAPE_FAILED",
          detail: "Network timeout",
        },
        timestamp: "2023-01-01T00:00:00.000Z",
        version: "1.0.0",
        author: "Juan Felipe Reyes Sanchez",
        github: "https://github.com/felipesanchez-dev",
      });
    });

    it("should handle ValidationError correctly", () => {
      const validationError = new ValidationError(
        "Invalid input",
        "Field required"
      );

      errorMiddleware.handle(
        validationError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Invalid input",
        error: {
          code: "VALIDATION_ERROR",
          detail: "Field required",
        },
        timestamp: "2023-01-01T00:00:00.000Z",
        version: "1.0.0",
        author: "Juan Felipe Reyes Sanchez",
        github: "https://github.com/felipesanchez-dev",
      });
    });

    it("should handle generic Error correctly", () => {
      const genericError = new Error("Generic error message");

      errorMiddleware.handle(
        genericError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.error).toHaveBeenCalledWith("Unhandled error:", {
        error: "Generic error message",
        stack: genericError.stack,
        path: "/test-path",
        method: "GET",
      });

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: {
          code: "INTERNAL_ERROR",
          detail: "Generic error message",
        },
        timestamp: "2023-01-01T00:00:00.000Z",
        version: "1.0.0",
        author: "Juan Felipe Reyes Sanchez",
        github: "https://github.com/felipesanchez-dev",
      });
    });

    it("should handle error with different request properties", () => {
      const error = new Error("Test error");
      const requestWithDifferentProps = {
        path: "/api/coffee",
        method: "POST",
      };

      errorMiddleware.handle(
        error,
        requestWithDifferentProps as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.error).toHaveBeenCalledWith("Unhandled error:", {
        error: "Test error",
        stack: error.stack,
        path: "/api/coffee",
        method: "POST",
      });
    });
  });

  describe("notFound", () => {
    beforeEach(() => {
      jest
        .spyOn(Date.prototype, "toISOString")
        .mockReturnValue("2023-01-01T00:00:00.000Z");
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should handle 404 not found correctly", () => {
      errorMiddleware.notFound(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Endpoint not found",
        error: {
          code: "NOT_FOUND",
          detail: "Path /test-path not found",
        },
        timestamp: "2023-01-01T00:00:00.000Z",
        version: "1.0.0",
        author: "Juan Felipe Reyes Sanchez",
        github: "https://github.com/felipesanchez-dev",
      });
    });

    it("should handle different paths in not found", () => {
      const requestWithDifferentPath = {
        path: "/api/nonexistent",
        method: "DELETE",
      };

      errorMiddleware.notFound(
        requestWithDifferentPath as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Endpoint not found",
        error: {
          code: "NOT_FOUND",
          detail: "Path /api/nonexistent not found",
        },
        timestamp: "2023-01-01T00:00:00.000Z",
        version: "1.0.0",
        author: "Juan Felipe Reyes Sanchez",
        github: "https://github.com/felipesanchez-dev",
      });
    });
  });
});
