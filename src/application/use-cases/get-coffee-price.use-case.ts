import { CoffeePriceIndicator } from "../../domain/entities/coffee-price.entity";
import {
  CoffeePriceRepository,
  CacheService,
  Logger,
} from "../../domain/interfaces/services.interface";
import { NormalizationService } from "../../domain/services/normalization.service";
import { ScrapingError } from "../../domain/errors/app.errors";

export class GetCoffeePriceUseCase {
  private readonly CACHE_KEY = "coffee_price_today";

  constructor(
    private readonly coffeePriceRepository: CoffeePriceRepository,
    private readonly cacheService: CacheService,
    private readonly logger: Logger,
    private readonly cacheTtlMs: number = 300000
  ) {}

  async execute(): Promise<CoffeePriceIndicator> {
    this.logger.info("Starting coffee price scraping process");

    const cachedData = this.cacheService.get<CoffeePriceIndicator>(
      this.CACHE_KEY
    );
    if (cachedData) {
      this.logger.info("Returning cached coffee price data");
      return cachedData;
    }

    try {
      this.logger.info("Cache miss, scraping fresh data");
      const scrapedData = await this.coffeePriceRepository.scrapeCoffeePrice();

      const normalizedData =
        NormalizationService.normalizeCoffeePrice(scrapedData);

      this.cacheService.set(this.CACHE_KEY, normalizedData, this.cacheTtlMs);

      this.logger.info("Successfully scraped and cached coffee price data");
      return normalizedData;
    } catch (error) {
      this.logger.error("Failed to get coffee price", error);
      throw new ScrapingError(
        "No fue posible obtener el precio del café",
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
