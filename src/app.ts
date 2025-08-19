import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { DependencyContainer } from "./shared/dependency-container";
import { AppRoutes } from "./interfaces/routes/app.routes";
import { CoffeePriceRoutes } from "./interfaces/routes/coffee-price.routes";
import { config } from "./config/app.config";

export class App {
  private app: Application;
  private container: DependencyContainer;

  constructor() {
    this.app = express();
    this.container = DependencyContainer.getInstance();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use((req, res, next) => {
      this.container.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      next();
    });
  }

  private setupRoutes(): void {
    const appRoutes = new AppRoutes(this.container.appController);
    this.app.use("/", appRoutes.getRoutes());

    const coffeePriceRoutes = new CoffeePriceRoutes(
      this.container.coffeePriceController
    );
    this.app.use("/", coffeePriceRoutes.getRoutes());
  }

  private setupErrorHandling(): void {
    this.app.use(this.container.errorMiddleware.notFound);

    this.app.use(this.container.errorMiddleware.handle);
  }

  public start(): void {
    this.app.listen(config.port, () => {
      this.container.logger.info(
        `🚀 MiCafe API server is running on port ${config.port}`
      );
      this.container.logger.info(`📱 Environment: ${config.nodeEnv}`);
      this.container.logger.info(`🔄 Cache TTL: ${config.cacheTtlMs}ms`);
      this.container.logger.info(
        `🕸️  Scraping URL: ${config.federacionCafeterosUrl}`
      );
    });
  }

  public getApp(): Application {
    return this.app;
  }
}
