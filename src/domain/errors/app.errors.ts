export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly detail?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ScrapingError extends AppError {
  constructor(message: string, detail?: string) {
    super(message, "SCRAPE_FAILED", 500, detail);
    this.name = "ScrapingError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, detail?: string) {
    super(message, "VALIDATION_ERROR", 400, detail);
    this.name = "ValidationError";
  }
}

export class NetworkError extends AppError {
  constructor(message: string, detail?: string) {
    super(message, "NETWORK_ERROR", 503, detail);
    this.name = "NetworkError";
  }
}
