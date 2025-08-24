import { GetLiveStatisticsUseCase } from "../../application/use-cases/get-live-statistics.use-case";
import { IceFuturesRepository, CacheService, Logger } from "../../domain/interfaces/services.interface";
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
    lastUpdate: "2025-01-23T10:00:00.000Z",
    dataPoints: 50,
    timeRange: "1M",
    data: Array.from({ length: 50 }, (_, i) => ({
      date: "2025-01-23",
      time: "10:00:00",
      price: 100 + i,
      change: 1.5,
      changePercent: 1.5,
      volume: 1000,
      openInterest: 5000,
      high: 105,
      low: 95,
      settlement: 100,
      timestamp: Date.now() + i * 1000
    })),
    statistics: {
      avgPrice: 125,
      maxPrice: 150,
      minPrice: 100,
      volatility: 12.5,
      trend: "BULLISH",
      priceChange30d: 5.2,
      volumeAvg: 1000
    },
    source: {
      url: "https://www.ice.com/products/15/Coffee-C-Futures/data",
      scrapeTime: "2025-01-23T10:00:00.000Z"
    }
  };

  beforeEach(() => {
    mockRepository = {
      getIceFuturesData: jest.fn()
    };

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      logCacheOperation: jest.fn(),
      logScrapingStatus: jest.fn()
    };

    useCase = new GetLiveStatisticsUseCase(
      mockRepository,
      mockCache,
      mockLogger,
      600000 // 10 minutos
    );
  });

  describe("execute", () => {
    it("should return cached data when available", async () => {
      // Arrange
      mockCache.get.mockReturnValue(mockFuturesData);

      // Act
      const result = await useCase.execute("1M");

      // Assert
      expect(result).toEqual(mockFuturesData);
      expect(mockCache.get).toHaveBeenCalledWith("ice_futures_1M");
      expect(mockLogger.logCacheOperation).toHaveBeenCalledWith("HIT", "ice_futures_1M");
      expect(mockRepository.getIceFuturesData).not.toHaveBeenCalled();
    });

    it("should fetch fresh data when cache is empty", async () => {
      // Arrange
      mockCache.get.mockReturnValue(null);
      mockRepository.getIceFuturesData.mockResolvedValue(mockFuturesData);

      // Act
      const result = await useCase.execute("1M");

      // Assert
      expect(result).toBeDefined();
      expect(result.dataPoints).toBeGreaterThan(0);
      expect(mockCache.get).toHaveBeenCalledWith("ice_futures_1M");
      expect(mockLogger.logCacheOperation).toHaveBeenCalledWith("MISS", "ice_futures_1M");
      expect(mockRepository.getIceFuturesData).toHaveBeenCalledWith("1M");
      expect(mockCache.set).toHaveBeenCalled();
    });

    it("should validate time range parameter", async () => {
      // Act & Assert
      await expect(useCase.execute("invalid" as any)).rejects.toThrow(ValidationError);
    });

    it("should validate data quality", async () => {
      // Arrange
      const insufficientData = { 
        ...mockFuturesData, 
        dataPoints: 5, 
        data: mockFuturesData.data.slice(0, 5) 
      };
      mockCache.get.mockReturnValue(null);
      mockRepository.getIceFuturesData.mockResolvedValue(insufficientData);

      // Act & Assert
      await expect(useCase.execute("1M")).rejects.toThrow(ValidationError);
    });

    it("should handle repository errors gracefully", async () => {
      // Arrange
      mockCache.get.mockReturnValue(null);
      mockRepository.getIceFuturesData.mockRejectedValue(new Error("Network error"));

      // Act & Assert
      await expect(useCase.execute("1M")).rejects.toThrow(ScrapingError);
      expect(mockLogger.logScrapingStatus).toHaveBeenCalledWith(
        "FAILED", 1, 3, expect.any(Number), "Network error"
      );
    });

    it("should work with different time ranges", async () => {
      // Arrange
      const testRanges: Array<'1M' | '3M' | '6M' | '1Y'> = ['1M', '3M', '6M', '1Y'];
      mockCache.get.mockReturnValue(null);

      for (const range of testRanges) {
        // Crear datos suficientes para cada rango
        const requiredPoints = range === '1Y' ? 250 : range === '6M' ? 180 : range === '3M' ? 90 : 30;
        const rangeData = { 
          ...mockFuturesData, 
          timeRange: range,
          dataPoints: requiredPoints,
          data: Array.from({ length: requiredPoints }, (_, i) => ({
            date: "2025-01-23",
            time: "10:00:00",
            price: 100 + i,
            change: 1.5,
            changePercent: 1.5,
            volume: 1000,
            openInterest: 5000,
            high: 105,
            low: 95,
            settlement: 100,
            timestamp: Date.now() + i * 1000
          }))
        };
        mockRepository.getIceFuturesData.mockResolvedValue(rangeData);

        // Act
        const result = await useCase.execute(range);

        // Assert
        expect(result.timeRange).toBe(range);
        expect(result.dataPoints).toBe(requiredPoints);
        expect(mockRepository.getIceFuturesData).toHaveBeenCalledWith(range);
      }
    });

    it("should enrich data with quality metrics", async () => {
      // Arrange
      mockCache.get.mockReturnValue(null);
      mockRepository.getIceFuturesData.mockResolvedValue(mockFuturesData);

      // Act
      const result = await useCase.execute("1M");

      // Assert
      expect(result).toHaveProperty("statistics");
      expect(result.statistics).toHaveProperty("avgPrice");
      expect(result.statistics).toHaveProperty("trend");
      expect((result as any).dataQuality).toBeDefined();
      expect((result as any).dataQuality).toHaveProperty("qualityScore");
      expect((result as any).dataQuality).toHaveProperty("recommendation");
    });
  });
});
