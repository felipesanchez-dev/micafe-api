import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { DependencyContainer } from "./shared/dependency-container";
import { AppRoutes } from "./interfaces/routes/app.routes";
import { CoffeePriceRoutes } from "./interfaces/routes/coffee-price.routes";
import { RequestLoggerMiddleware } from "./interfaces/middleware/request-logger.middleware";
import { config } from "./config/app.config";

export class App {
  private app: Application;
  private container: DependencyContainer;
  private requestLogger: RequestLoggerMiddleware;

  constructor() {
    this.app = express();
    this.container = DependencyContainer.getInstance();
    this.requestLogger = new RequestLoggerMiddleware(this.container.logger);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Usar el nuevo middleware de logging estructurado
    this.app.use(this.requestLogger.logIncoming);
    this.app.use(this.requestLogger.logOutgoing);
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
      this.container.logger.logStartup?.(config.port, config.nodeEnv);
    });
  }

  public getApp(): Application {
    return this.app;
  }
}
