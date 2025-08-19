import { Request, Response } from "express";
import { ApiMetadata, ServiceStatus } from "../dto/api-response.dto";
import {
  CacheService,
  Logger,
} from "../../domain/interfaces/services.interface";

export class AppController {
  private startTime: number;

  constructor(
    private readonly cacheService: CacheService,
    private readonly logger: Logger
  ) {
    this.startTime = Date.now();
  }

  getApiInfo(req: Request, res: Response): void {
    this.logger.info("GET / - API info request received");

    const metadata: ApiMetadata = {
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
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(metadata);
  }

  getStatus(req: Request, res: Response): void {
    this.logger.info("GET /status - Status request received");

    const uptime = Date.now() - this.startTime;
    const cacheStats = this.cacheService.getStats
      ? this.cacheService.getStats()
      : undefined;

    const status: ServiceStatus = {
      status: "healthy",
      uptime: Math.floor(uptime / 1000),
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      cacheStats,
    };

    res.status(200).json(status);
  }
}
