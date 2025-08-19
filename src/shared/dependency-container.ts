import { GetCoffeePriceUseCase } from "../application/use-cases/get-coffee-price.use-case";
import { FederacionCafeterosRepository } from "../infrastructure/repositories/federacion-cafeteros.repository";
import { InMemoryCacheService } from "../infrastructure/services/cache.service";
import { PinoLogger } from "../infrastructure/services/logger.service";
import { CoffeePriceController } from "../interfaces/controllers/coffee-price.controller";
import { AppController } from "../interfaces/controllers/app.controller";
import { ErrorMiddleware } from "../interfaces/middleware/error.middleware";
import { config } from "../config/app.config";

export class DependencyContainer {
  private static instance: DependencyContainer;

  public readonly logger = new PinoLogger(config.logLevel);
  public readonly cacheService = new InMemoryCacheService(config.cacheTtlMs);

  public readonly coffeePriceRepository = new FederacionCafeterosRepository(
    config.federacionCafeterosUrl,
    this.logger,
    config.scrapingTimeoutMs,
    config.maxRetries,
    config.retryDelayMs
  );

  public readonly getCoffeePriceUseCase = new GetCoffeePriceUseCase(
    this.coffeePriceRepository,
    this.cacheService,
    this.logger,
    config.cacheTtlMs
  );

  public readonly coffeePriceController = new CoffeePriceController(
    this.getCoffeePriceUseCase,
    this.logger
  );

  public readonly appController = new AppController(
    this.cacheService,
    this.logger
  );

  public readonly errorMiddleware = new ErrorMiddleware(this.logger);

  private constructor() {}

  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }
}
