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
    const cachedData = this.cacheService.get<CoffeePriceIndicator>(
      this.CACHE_KEY
    );
    if (cachedData) {
      this.logger.logCacheOperation?.("HIT", this.CACHE_KEY);
      return cachedData;
    }

    const startTime = Date.now();
    try {
      this.logger.logCacheOperation?.("MISS", this.CACHE_KEY);

      const scrapedData = await this.coffeePriceRepository.scrapeCoffeePrice();

      const normalizedData =
        NormalizationService.normalizeCoffeePrice(scrapedData);

      this.cacheService.set(this.CACHE_KEY, normalizedData, this.cacheTtlMs);

      const duration = Date.now() - startTime;
      this.logger.logScrapingStatus?.(
        "SUCCESS",
        undefined,
        undefined,
        duration
      );

      return normalizedData;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.logScrapingStatus?.(
        "FAILED",
        undefined,
        undefined,
        duration,
        errorMessage
      );

      throw new ScrapingError(
        "No fue posible obtener el precio del café",
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
