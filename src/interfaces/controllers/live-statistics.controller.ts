import { Request, Response } from "express";
import { GetLiveStatisticsUseCase } from "../../application/use-cases/get-live-statistics.use-case";
import { ApiResponse } from "../dto/api-response.dto";
import { AppError, ValidationError } from "../../domain/errors/app.errors";
import { Logger } from "../../domain/interfaces/services.interface";

export class LiveStatisticsController {
  constructor(
    private readonly getLiveStatisticsUseCase: GetLiveStatisticsUseCase,
    private readonly logger: Logger
  ) {}

  async getLiveStatistics(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const ip = (req as any).context?.ip || req.ip || "unknown";
    const timeRange = (req.query.range as "1Y") || "1Y";

    try {
      this.logger.logRequest?.(
        "GET",
        `/estadisticas-en-vivo?range=${timeRange}`,
        ip,
        req.get("User-Agent")
      );

      this.validateQueryParameters(req.query);

      const statisticsData = await this.getLiveStatisticsUseCase.execute(
        timeRange
      );
      const duration = Date.now() - startTime;

      const response: ApiResponse = {
        success: true,
        message: `Estadísticas en vivo obtenidas exitosamente para período ${timeRange}`,
        data: {
          ...statisticsData,
          metadata: {
            requestId: this.logger.generateRequestId?.() || `req_${Date.now()}`,
            processingTime: `${duration}ms`,
            dataFreshness: this.calculateDataFreshness(
              statisticsData.lastUpdate
            ),
            nextUpdate: this.calculateNextUpdateTime(),
            apiVersion: "1.0.0",
            endpoints: {
              refresh: `/estadisticas-en-vivo?range=${timeRange}&force=true`,
              historical: `/estadisticas-en-vivo?range=1Y`,
              realTime: `/estadisticas-en-vivo?range=1M`,
            },
          },
        },
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        author: "Juan Felipe Reyes Sanchez",
        github: "https://github.com/felipesanchez-dev",
      };

      this.logger.logSuccess?.(
        `Live statistics retrieved successfully for ${timeRange} | ${duration}ms | ${statisticsData.dataPoints} data points`,
        200,
        ip
      );

      this.logger.logResponse?.(
        "GET",
        "/estadisticas-en-vivo",
        200,
        duration,
        ip
      );

      res.status(200).json(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      const isAppError = error instanceof AppError;
      const statusCode = isAppError ? error.statusCode : 500;
      const errorCode = isAppError ? error.code : "INTERNAL_ERROR";
      const errorDetail = isAppError
        ? error.detail
        : "Error interno del servidor";
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.logError?.(
        `Live statistics request failed | ${duration}ms | Range: ${timeRange}`,
        statusCode,
        ip,
        errorMessage
      );

      this.logger.logResponse?.(
        "GET",
        "/estadisticas-en-vivo",
        statusCode,
        duration,
        ip
      );

      const errorResponse: ApiResponse = {
        success: false,
        message: errorMessage,
        data: null,
        error: {
          code: errorCode,
          detail: errorDetail,
          requestId: this.logger.generateRequestId?.() || `req_${Date.now()}`,
          suggestions: this.getErrorSuggestions(
            error instanceof Error ? error : new Error(String(error)),
            timeRange
          ),
        },
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        author: "Juan Felipe Reyes Sanchez",
        github: "https://github.com/felipesanchez-dev",
      };

      res.status(statusCode).json(errorResponse);
    }
  }

  private validateQueryParameters(query: any): void {
    const { range, force } = query;

    if (range && !["1M", "3M", "6M", "1Y"].includes(range)) {
      throw new ValidationError(
        "Parámetro 'range' inválido",
        "Los valores válidos son: 1M, 3M, 6M, 1Y"
      );
    }

    if (force && !["true", "false"].includes(force.toLowerCase())) {
      throw new ValidationError(
        "Parámetro 'force' inválido",
        "Los valores válidos son: true, false"
      );
    }
  }

  private calculateDataFreshness(lastUpdate: string): string {
    const lastUpdateTime = new Date(lastUpdate);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60)
    );

    if (diffMinutes < 5) return "Muy reciente";
    if (diffMinutes < 15) return "Reciente";
    if (diffMinutes < 60) return "Moderadamente reciente";
    if (diffMinutes < 240) return "Algo desactualizado";
    return "Desactualizado";
  }

  private calculateNextUpdateTime(): string {
    const now = new Date();
    const nextUpdate = new Date(now.getTime() + 10 * 60 * 1000);
    return nextUpdate.toISOString();
  }

  private getErrorSuggestions(error: Error, timeRange: string): string[] {
    const suggestions: string[] = [];

    if (error instanceof ValidationError) {
      suggestions.push(
        "Verifique que los parámetros de la solicitud sean correctos"
      );
      suggestions.push(
        "Consulte la documentación de la API para parámetros válidos"
      );
    } else {
      suggestions.push("Intente nuevamente en unos minutos");
      suggestions.push(
        `Pruebe con un rango de tiempo diferente (actual: ${timeRange})`
      );
      suggestions.push("Verifique su conexión a internet");
    }

    switch (timeRange) {
      case "1Y":
        suggestions.push(
          "Los datos anuales pueden tardar más en cargarse, considere usar un rango menor"
        );
        break;
      case "6M":
        suggestions.push(
          "Para datos de 6 meses, asegúrese de tener una conexión estable"
        );
        break;
    }

    suggestions.push("Contacte al administrador si el problema persiste");

    return suggestions;
  }
}
