import { GetLiveStatisticsUseCase } from "../../application/use-cases/get-live-statistics.use-case";
import {
  IceFuturesRepository,
  CacheService,
  Logger,
} from "../../domain/interfaces/services.interface";
import { IceFuturesHistory } from "../../domain/entities/ice-futures.entity";
import { ValidationError, ScrapingError } from "../../domain/errors/app.errors";

describe("GetLiveStatisticsUseCase", () => {
  let useCase: GetLiveStatisticsUseCase;
  let mockRepository: jest.Mocked<IceFuturesRepository>;
  let mockCache: jest.Mocked<CacheService>;
  let mockLogger: jest.Mocked<Logger>;

  const mockFuturesData: IceFuturesHistory = {
    symbol: "KC",
    name: "Coffee C Futures",
    exchange: "ICE",
    currency: "USD",
    lastUpdate: "2025-08-24T10:00:00.000Z",
    dataPoints: 15,
    timeRange: "1Y",
    data: Array.from({ length: 15 }, (_, i) => ({
      date: "2025-08-24",
      time: "10:00:00",
      price: 300 + i * 10,
      change: 1.5,
      changePercent: 0.5,
      volume: 1000 + i * 100,
      openInterest: 5000,
      high: 315 + i * 10,
      low: 295 + i * 10,
      settlement: 300 + i * 10,
      timestamp: Date.now() + i * 1000,
    })),
    statistics: {
      avgPrice: 350,
      maxPrice: 440,
      minPrice: 300,
      volatility: 12.5,
      trend: "BULLISH",
      priceChange30d: 5.2,
      volumeAvg: 1500,
    },
    source: {
      url: "https://www.ice.com/products/15/Coffee-C-Futures/data",
      scrapeTime: "2025-08-24T10:00:00.000Z",
    },
  };

  beforeEach(() => {
    mockRepository = {
      getIceFuturesData: jest.fn(),
    };

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      logCacheOperation: jest.fn(),
      logScrapingStatus: jest.fn(),
    };

    useCase = new GetLiveStatisticsUseCase(
      mockRepository,
      mockCache,
      mockLogger,
      600000
    );
  });

  describe("execute", () => {
    it("should return cached data when available", async () => {
      mockCache.get.mockReturnValue(mockFuturesData);

      const result = await useCase.execute("1Y");

      expect(result).toEqual(mockFuturesData);
      expect(mockCache.get).toHaveBeenCalledWith("ice_futures_1Y");
      expect(mockLogger.logCacheOperation).toHaveBeenCalledWith(
        "HIT",
        "ice_futures_1Y"
      );
      expect(mockRepository.getIceFuturesData).not.toHaveBeenCalled();
    });

    it("should fetch fresh data when cache is empty", async () => {
      mockCache.get.mockReturnValue(null);
      mockRepository.getIceFuturesData.mockResolvedValue(mockFuturesData);

      const result = await useCase.execute("1Y");

      expect(result).toBeDefined();
      expect(result.dataPoints).toBeGreaterThan(0);
      expect(mockCache.get).toHaveBeenCalledWith("ice_futures_1Y");
      expect(mockLogger.logCacheOperation).toHaveBeenCalledWith(
        "MISS",
        "ice_futures_1Y"
      );
      expect(mockRepository.getIceFuturesData).toHaveBeenCalledWith("1Y");
      expect(mockCache.set).toHaveBeenCalled();
    });

    it("should validate time range parameter", async () => {
      await expect(useCase.execute("invalid" as any)).rejects.toThrow(
        ValidationError
      );
    });

    it("should handle repository errors gracefully", async () => {
      mockCache.get.mockReturnValue(null);
      mockRepository.getIceFuturesData.mockRejectedValue(
        new Error("Network error")
      );

      await expect(useCase.execute("1Y")).rejects.toThrow(ScrapingError);
      expect(mockLogger.logScrapingStatus).toHaveBeenCalledWith(
        "FAILED",
        1,
        3,
        expect.any(Number),
        "Network error"
      );
    });

    it("should work with 1Y time range", async () => {
      mockCache.get.mockReturnValue(null);
      mockRepository.getIceFuturesData.mockResolvedValue(mockFuturesData);

      const result = await useCase.execute("1Y");

      expect(result.timeRange).toBe("1Y");
      expect(result.dataPoints).toBeGreaterThan(0);
      expect(mockRepository.getIceFuturesData).toHaveBeenCalledWith("1Y");
    });

    it("should enrich data with quality metrics", async () => {
      mockCache.get.mockReturnValue(null);
      mockRepository.getIceFuturesData.mockResolvedValue(mockFuturesData);

      const result = await useCase.execute("1Y");

      expect(result).toHaveProperty("statistics");
      expect(result.statistics).toHaveProperty("avgPrice");
      expect(result.statistics).toHaveProperty("trend");
      expect((result as any).dataQuality).toBeDefined();
      expect((result as any).dataQuality).toHaveProperty("qualityScore");
      expect((result as any).dataQuality).toHaveProperty("recommendation");
    });
  });
});
