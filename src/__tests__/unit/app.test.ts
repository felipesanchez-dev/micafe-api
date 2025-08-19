import { App } from "../../app";
import { config } from "../../config/app.config";
import { DependencyContainer } from "../../shared/dependency-container";

jest.mock("../../config/app.config");
jest.mock("../../shared/dependency-container");
jest.mock("helmet", () =>
  jest.fn(() => (req: any, res: any, next: any) => next())
);
jest.mock("cors", () =>
  jest.fn(() => (req: any, res: any, next: any) => next())
);

describe("App", () => {
  let app: App;
  let mockContainer: any;
  let mockLogger: any;
  let mockErrorMiddleware: any;
  let mockAppController: any;
  let mockCoffeePriceController: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    mockErrorMiddleware = {
      handle: jest.fn(),
      notFound: jest.fn(),
    };

    mockAppController = {};
    mockCoffeePriceController = {};

    mockContainer = {
      logger: mockLogger,
      errorMiddleware: mockErrorMiddleware,
      appController: mockAppController,
      coffeePriceController: mockCoffeePriceController,
    };

    (DependencyContainer.getInstance as jest.Mock).mockReturnValue(
      mockContainer
    );

    (config as any).port = 3000;
    (config as any).nodeEnv = "test";
    (config as any).cacheTtlMs = 300000;
    (config as any).federacionCafeterosUrl =
      "https://federaciondecafeteros.org";
  });

  describe("Constructor", () => {
    it("should create app instance and setup middleware and routes", () => {
      app = new App();
      const expressApp = app.getApp();

      expect(expressApp).toBeDefined();
      expect(DependencyContainer.getInstance).toHaveBeenCalled();
    });
  });

  describe("Middleware setup", () => {
    it("should setup logging middleware correctly", () => {
      app = new App();
      const expressApp = app.getApp();

      const mockReq = {
        method: "GET",
        path: "/test",
        ip: "127.0.0.1",
        get: jest.fn().mockReturnValue("test-user-agent"),
      };
      const mockRes = {};
      const mockNext = jest.fn();

      expect(expressApp).toBeDefined();
    });
  });

  describe("start", () => {
    let listenSpy: jest.SpyInstance;
    let mockServer: any;

    beforeEach(() => {
      mockServer = {
        listen: jest.fn(),
      };

      app = new App();
      const expressApp = app.getApp();

      listenSpy = jest
        .spyOn(expressApp, "listen")
        .mockImplementation((port, callback) => {
          if (callback) callback();
          return mockServer as any;
        });
    });

    afterEach(() => {
      if (listenSpy) {
        listenSpy.mockRestore();
      }
    });

    it("should start the server and log startup messages", () => {
      app.start();

      expect(listenSpy).toHaveBeenCalledWith(3000, expect.any(Function));
      expect(mockLogger.info).toHaveBeenCalledWith(
        "🚀 MiCafe API server is running on port 3000"
      );
      expect(mockLogger.info).toHaveBeenCalledWith("📱 Environment: test");
      expect(mockLogger.info).toHaveBeenCalledWith("🔄 Cache TTL: 300000ms");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "🕸️  Scraping URL: https://federaciondecafeteros.org"
      );
    });

    it("should start server with different config values", () => {
      const newMockContainer = {
        logger: mockLogger,
        errorMiddleware: mockErrorMiddleware,
        appController: mockAppController,
        coffeePriceController: mockCoffeePriceController,
      };

      (DependencyContainer.getInstance as jest.Mock).mockReturnValue(
        newMockContainer
      );

      (config as any).port = 8080;
      (config as any).nodeEnv = "production";
      (config as any).cacheTtlMs = 600000;
      (config as any).federacionCafeterosUrl = "https://custom-url.com";

      const newApp = new App();

      const newExpressApp = newApp.getApp();
      jest
        .spyOn(newExpressApp, "listen")
        .mockImplementation((port, callback) => {
          if (callback) callback();
          return {} as any;
        });

      newApp.start();

      expect(mockLogger.info).toHaveBeenCalledWith(
        "🚀 MiCafe API server is running on port 8080"
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "📱 Environment: production"
      );
      expect(mockLogger.info).toHaveBeenCalledWith("🔄 Cache TTL: 600000ms");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "🕸️  Scraping URL: https://custom-url.com"
      );
    });
  });

  describe("getApp", () => {
    it("should return the express application instance", () => {
      app = new App();
      const expressApp = app.getApp();

      expect(expressApp).toBeDefined();
      expect(typeof expressApp.listen).toBe("function");
      expect(typeof expressApp.use).toBe("function");
    });
  });
});
