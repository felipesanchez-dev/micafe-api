import { Request, Response } from "express";
import { AppController } from "../../interfaces/controllers/app.controller";
import {
  CacheService,
  Logger,
} from "../../domain/interfaces/services.interface";

describe("AppController", () => {
  let controller: AppController;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockLogger: jest.Mocked<Logger>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {};
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    controller = new AppController(mockCacheService, mockLogger);

    jest.spyOn(Date, "now").mockReturnValue(1000000);
    jest
      .spyOn(Date.prototype, "toISOString")
      .mockReturnValue("2023-01-01T00:00:00.000Z");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getApiInfo", () => {
    it("should return API metadata", () => {
      controller.getApiInfo(mockRequest as Request, mockResponse as Response);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "GET / - API info request received"
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        name: "MiCafe API",
        version: "1.0.0",
        description: "API para obtener indicadores del café de Colombia",
        author: "Juan Felipe Reyes Sanchez",
        github: "https://github.com/felipesanchez-dev",
        endpoints: {
          "/": "Información del servicio",
          "/status": "Estado de scraping y salud",
          "/precio-hoy": "Obtiene el precio de café de hoy vía scraping",
        },
        status: "online",
        retrySystem: "Enabled (3 attempts)",
        timestamp: "2023-01-01T00:00:00.000Z",
      });
    });
  });

  describe("getStatus", () => {
    it("should return service status with cache stats when available", () => {
      const mockCacheStats = { size: 10, keys: ["coffee_price_today"] };
      (mockCacheService.getStats as jest.Mock).mockReturnValue(mockCacheStats);

      jest
        .spyOn(Date, "now")
        .mockReturnValueOnce(1000000)
        .mockReturnValueOnce(1005000);

      const newController = new AppController(mockCacheService, mockLogger);

      newController.getStatus(mockRequest as Request, mockResponse as Response);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "GET /status - Status request received"
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        status: "healthy",
        uptime: 5,
        timestamp: "2023-01-01T00:00:00.000Z",
        version: "1.0.0",
        cacheStats: mockCacheStats,
      });
    });

    it("should return service status without cache stats when not available", () => {
      const cacheServiceWithoutStats = {
        get: jest.fn(),
        set: jest.fn(),
        clear: jest.fn(),
      };

      jest
        .spyOn(Date, "now")
        .mockReturnValueOnce(1000000)
        .mockReturnValueOnce(1010000);

      const controllerWithoutStats = new AppController(
        cacheServiceWithoutStats as any,
        mockLogger
      );

      controllerWithoutStats.getStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith({
        status: "healthy",
        uptime: 10,
        timestamp: "2023-01-01T00:00:00.000Z",
        version: "1.0.0",
        cacheStats: undefined,
      });
    });

    it("should calculate uptime correctly", () => {
      const startTime = 1000000;
      const currentTime = 1060000;

      jest
        .spyOn(Date, "now")
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(currentTime);

      const newController = new AppController(mockCacheService, mockLogger);

      newController.getStatus(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          uptime: 60,
        })
      );
    });
  });
});
