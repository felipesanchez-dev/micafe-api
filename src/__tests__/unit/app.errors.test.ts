import {
  AppError,
  ScrapingError,
  ValidationError,
  NetworkError,
} from "../../domain/errors/app.errors";

describe("App Errors", () => {
  describe("AppError", () => {
    it("should create AppError with default statusCode", () => {
      const error = new AppError("Test message", "TEST_CODE");

      expect(error.message).toBe("Test message");
      expect(error.code).toBe("TEST_CODE");
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe("AppError");
      expect(error.detail).toBeUndefined();
    });

    it("should create AppError with custom statusCode and detail", () => {
      const error = new AppError(
        "Test message",
        "TEST_CODE",
        404,
        "Test detail"
      );

      expect(error.message).toBe("Test message");
      expect(error.code).toBe("TEST_CODE");
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe("AppError");
      expect(error.detail).toBe("Test detail");
    });
  });

  describe("ScrapingError", () => {
    it("should create ScrapingError with default properties", () => {
      const error = new ScrapingError("Scraping failed");

      expect(error.message).toBe("Scraping failed");
      expect(error.code).toBe("SCRAPE_FAILED");
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe("ScrapingError");
      expect(error.detail).toBeUndefined();
    });

    it("should create ScrapingError with detail", () => {
      const error = new ScrapingError("Scraping failed", "Network timeout");

      expect(error.message).toBe("Scraping failed");
      expect(error.code).toBe("SCRAPE_FAILED");
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe("ScrapingError");
      expect(error.detail).toBe("Network timeout");
    });
  });

  describe("ValidationError", () => {
    it("should create ValidationError with correct properties", () => {
      const error = new ValidationError("Invalid input");

      expect(error.message).toBe("Invalid input");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe("ValidationError");
    });

    it("should create ValidationError with detail", () => {
      const error = new ValidationError("Invalid input", "Field is required");

      expect(error.message).toBe("Invalid input");
      expect(error.detail).toBe("Field is required");
    });
  });

  describe("NetworkError", () => {
    it("should create NetworkError with correct properties", () => {
      const error = new NetworkError("Network failed");

      expect(error.message).toBe("Network failed");
      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.statusCode).toBe(503);
      expect(error.name).toBe("NetworkError");
    });

    it("should create NetworkError with detail", () => {
      const error = new NetworkError("Network failed", "Connection refused");

      expect(error.message).toBe("Network failed");
      expect(error.detail).toBe("Connection refused");
    });
  });
});
