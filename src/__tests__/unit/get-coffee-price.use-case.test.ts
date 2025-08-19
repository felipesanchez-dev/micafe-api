import { GetCoffeePriceUseCase } from "../../application/use-cases/get-coffee-price.use-case";
import {
  CoffeePriceRepository,
  CacheService,
  Logger,
} from "../../domain/interfaces/services.interface";
import { ScrapedData } from "../../domain/entities/coffee-price.entity";
import { ScrapingError } from "../../domain/errors/app.errors";
import {
  scrapedDataFixture,
  expectedNormalizedData,
} from "../fixtures/html.fixture";

class MockCoffeePriceRepository implements CoffeePriceRepository {
  constructor(private shouldFail = false) {}

  async scrapeCoffeePrice(): Promise<ScrapedData> {
    if (this.shouldFail) {
      throw new Error("Scraping failed");
    }
    return scrapedDataFixture;
  }
}

class MockCacheService implements CacheService {
  private cache = new Map();

  get<T>(key: string): T | null {
    return this.cache.get(key) || null;
  }

  set<T>(key: string, value: T): void {
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

class MockLogger implements Logger {
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
  debug = jest.fn();
}

describe("GetCoffeePriceUseCase", () => {
  let useCase: GetCoffeePriceUseCase;
  let mockRepository: MockCoffeePriceRepository;
  let mockCache: MockCacheService;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockRepository = new MockCoffeePriceRepository();
    mockCache = new MockCacheService();
    mockLogger = new MockLogger();
    useCase = new GetCoffeePriceUseCase(
      mockRepository,
      mockCache,
      mockLogger,
      5000
    );
  });

  afterEach(() => {
    mockCache.clear();
  });

  describe("execute", () => {
    it("should return cached data when available", async () => {
      mockCache.set("coffee_price_today", expectedNormalizedData);

      const result = await useCase.execute();

      expect(result).toEqual(expectedNormalizedData);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Starting coffee price scraping process"
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Returning cached coffee price data"
      );
    });

    it("should scrape fresh data when cache is empty", async () => {
      const result = await useCase.execute();

      expect(result).toEqual(expectedNormalizedData);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Cache miss, scraping fresh data"
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Successfully scraped and cached coffee price data"
      );
    });

    it("should cache scraped data", async () => {
      await useCase.execute();

      const cachedData = mockCache.get("coffee_price_today");
      expect(cachedData).toEqual(expectedNormalizedData);
    });

    it("should throw ScrapingError when repository fails", async () => {
      mockRepository = new MockCoffeePriceRepository(true);
      useCase = new GetCoffeePriceUseCase(
        mockRepository,
        mockCache,
        mockLogger,
        5000
      );

      await expect(useCase.execute()).rejects.toThrow(ScrapingError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to get coffee price",
        expect.any(Error)
      );
    });

    it("should log scraping process steps", async () => {
      await useCase.execute();

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Starting coffee price scraping process"
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Cache miss, scraping fresh data"
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Successfully scraped and cached coffee price data"
      );
    });
  });
});
