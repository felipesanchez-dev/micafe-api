describe("App Config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("Default values", () => {
    it("should use default values when environment variables are not set", () => {
      delete process.env.PORT;
      delete process.env.NODE_ENV;
      delete process.env.CACHE_TTL_MS;
      delete process.env.SCRAPING_TIMEOUT_MS;
      delete process.env.MAX_RETRIES;
      delete process.env.RETRY_DELAY_MS;
      delete process.env.FEDERACION_CAFETEROS_URL;
      delete process.env.LOG_LEVEL;

      const { config } = require("../../config/app.config");

      expect(config.port).toBe(3000);
      expect(config.nodeEnv).toBe("development");
      expect(config.cacheTtlMs).toBe(300000);
      expect(config.scrapingTimeoutMs).toBe(10000);
      expect(config.maxRetries).toBe(3);
      expect(config.retryDelayMs).toBe(1000);
      expect(config.federacionCafeterosUrl).toBe(
        "https://federaciondecafeteros.org"
      );
      expect(config.logLevel).toBe("info");
    });
  });

  describe("Environment variable overrides", () => {
    it("should use environment variables when provided", () => {
      process.env.PORT = "4000";
      process.env.NODE_ENV = "production";
      process.env.CACHE_TTL_MS = "600000";
      process.env.SCRAPING_TIMEOUT_MS = "15000";
      process.env.MAX_RETRIES = "5";
      process.env.RETRY_DELAY_MS = "2000";
      process.env.FEDERACION_CAFETEROS_URL = "https://custom-url.com";
      process.env.LOG_LEVEL = "debug";

      const { config } = require("../../config/app.config");

      expect(config.port).toBe(4000);
      expect(config.nodeEnv).toBe("production");
      expect(config.cacheTtlMs).toBe(600000);
      expect(config.scrapingTimeoutMs).toBe(15000);
      expect(config.maxRetries).toBe(5);
      expect(config.retryDelayMs).toBe(2000);
      expect(config.federacionCafeterosUrl).toBe("https://custom-url.com");
      expect(config.logLevel).toBe("debug");
    });

    it("should handle partial environment variables", () => {
      delete process.env.NODE_ENV;
      delete process.env.CACHE_TTL_MS;

      process.env.PORT = "8080";
      process.env.LOG_LEVEL = "error";

      const { config } = require("../../config/app.config");

      expect(config.port).toBe(8080);
      expect(config.nodeEnv).toBe("development");
      expect(config.logLevel).toBe("error");
      expect(config.cacheTtlMs).toBe(300000);
    });
  });

  describe("Type conversion", () => {
    it("should convert string environment variables to numbers", () => {
      process.env.PORT = "5000";
      process.env.CACHE_TTL_MS = "123456";
      process.env.MAX_RETRIES = "10";

      const { config } = require("../../config/app.config");

      expect(typeof config.port).toBe("number");
      expect(typeof config.cacheTtlMs).toBe("number");
      expect(typeof config.maxRetries).toBe("number");
      expect(config.port).toBe(5000);
      expect(config.cacheTtlMs).toBe(123456);
      expect(config.maxRetries).toBe(10);
    });

    it("should handle invalid number strings with parseInt", () => {
      process.env.PORT = "invalid";
      process.env.CACHE_TTL_MS = "not-a-number";

      const { config } = require("../../config/app.config");

      expect(isNaN(config.port)).toBe(true);
      expect(isNaN(config.cacheTtlMs)).toBe(true);
    });

    it("should handle empty strings", () => {
      process.env.PORT = "";
      process.env.NODE_ENV = "";

      const { config } = require("../../config/app.config");

      expect(config.port).toBe(3000);
      expect(config.nodeEnv).toBe("development");
    });
  });
});
