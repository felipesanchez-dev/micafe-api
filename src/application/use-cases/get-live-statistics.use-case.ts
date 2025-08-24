import {
  IceFuturesHistory,
  IceFuturesData,
} from "../../domain/entities/ice-futures.entity";
import {
  IceFuturesRepository,
  CacheService,
  Logger,
} from "../../domain/interfaces/services.interface";
import { ScrapingError, ValidationError } from "../../domain/errors/app.errors";

export class GetLiveStatisticsUseCase {
  private readonly CACHE_KEY_PREFIX = "ice_futures_";

  constructor(
    private readonly iceFuturesRepository: IceFuturesRepository,
    private readonly cacheService: CacheService,
    private readonly logger: Logger,
    private readonly cacheTtlMs: number = 600000
  ) {}

  async execute(
    timeRange: "1M" | "3M" | "6M" | "1Y" = "1M"
  ): Promise<IceFuturesHistory> {
    this.validateTimeRange(timeRange);

    const cacheKey = `${this.CACHE_KEY_PREFIX}${timeRange}`;

    const cachedData = this.cacheService.get<IceFuturesHistory>(cacheKey);
    if (cachedData) {
      this.logger.logCacheOperation?.("HIT", cacheKey);
      this.logger.info(`Returning cached ICE futures data for ${timeRange}`, {
        dataPoints: cachedData.dataPoints,
        lastUpdate: cachedData.lastUpdate,
      });
      return cachedData;
    }

    this.logger.logCacheOperation?.("MISS", cacheKey);
    const startTime = Date.now();

    try {
      this.logger.logScrapingStatus?.("START", 1, 3);

      const futuresData = await this.iceFuturesRepository.getIceFuturesData(
        timeRange
      );

      this.validateDataQuality(futuresData, timeRange);

      const enrichedData = this.enrichData(futuresData);

      this.cacheService.set(cacheKey, enrichedData, this.cacheTtlMs);

      const duration = Date.now() - startTime;
      this.logger.logScrapingStatus?.("SUCCESS", 1, 3, duration);
      this.logger.info(
        `ICE futures data retrieved successfully for ${timeRange}`,
        {
          dataPoints: enrichedData.dataPoints,
          duration: `${duration}ms`,
          cacheKey,
        }
      );

      return enrichedData;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logScrapingStatus?.(
        "FAILED",
        1,
        3,
        duration,
        error instanceof Error ? error.message : String(error)
      );

      if (error instanceof ScrapingError || error instanceof ValidationError) {
        throw error;
      }

      throw new ScrapingError(
        "Error al obtener estadísticas en vivo de ICE",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private validateTimeRange(timeRange: string): void {
    const validRanges = ["1M", "3M", "6M", "1Y"];
    if (!validRanges.includes(timeRange)) {
      throw new ValidationError(
        `Rango de tiempo inválido: ${timeRange}`,
        `Los rangos válidos son: ${validRanges.join(", ")}`
      );
    }
  }

  private validateDataQuality(
    data: IceFuturesHistory,
    timeRange: string
  ): void {
    const minDataPoints = this.getMinDataPointsForRange(timeRange);

    if (data.dataPoints < minDataPoints) {
      throw new ValidationError(
        `Datos insuficientes para el análisis`,
        `Se necesitan al menos ${minDataPoints} puntos de datos para ${timeRange}, pero se obtuvieron ${data.dataPoints}`
      );
    }

    const latestDataTime = Math.max(...data.data.map((d) => d.timestamp));
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    if (latestDataTime < twentyFourHoursAgo) {
      this.logger.warn(`Datos de ICE podrían estar desactualizados`, {
        latestData: new Date(latestDataTime).toISOString(),
        timeRange,
      });
    }
  }

  private getMinDataPointsForRange(timeRange: string): number {
    switch (timeRange) {
      case "1M":
        return 20;
      case "3M":
        return 60;
      case "6M":
        return 120;
      case "1Y":
        return 200;
      default:
        return 20;
    }
  }

  private enrichData(data: IceFuturesHistory): IceFuturesHistory {
    const enrichedData = { ...data };

    enrichedData.source.scrapeTime = new Date().toISOString();

    if (!enrichedData.statistics && enrichedData.data.length > 0) {
      enrichedData.statistics = this.calculateEnhancedStatistics(
        enrichedData.data
      );
    }

    const dataQuality = this.assessDataQuality(enrichedData.data);
    (enrichedData as any).dataQuality = dataQuality;

    return enrichedData;
  }

  private calculateEnhancedStatistics(data: IceFuturesData[]) {
    if (data.length === 0) return undefined;

    const prices = data.map((d) => d.price);
    const volumes = data.map((d) => d.volume);

    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const volumeAvg = volumes.reduce((a, b) => a + b, 0) / volumes.length;

    const variance =
      prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) /
      prices.length;
    const volatility = Math.sqrt(variance);

    const recentData = data.slice(-10);
    const oldData = data.slice(0, 10);
    const recentAvg =
      recentData.reduce((sum, d) => sum + d.price, 0) / recentData.length;
    const oldAvg =
      oldData.reduce((sum, d) => sum + d.price, 0) / oldData.length;

    let trend: "BULLISH" | "BEARISH" | "NEUTRAL";
    const trendDiff = ((recentAvg - oldAvg) / oldAvg) * 100;

    if (trendDiff > 2) trend = "BULLISH";
    else if (trendDiff < -2) trend = "BEARISH";
    else trend = "NEUTRAL";

    const priceChange30d =
      data.length >= 30
        ? ((data[data.length - 1].price - data[data.length - 30].price) /
            data[data.length - 30].price) *
          100
        : 0;

    return {
      avgPrice: Number(avgPrice.toFixed(2)),
      maxPrice,
      minPrice,
      volatility: Number(volatility.toFixed(2)),
      trend,
      priceChange30d: Number(priceChange30d.toFixed(2)),
      volumeAvg: Number(volumeAvg.toFixed(0)),
    };
  }

  private assessDataQuality(data: IceFuturesData[]): any {
    const totalPoints = data.length;
    const validPrices = data.filter((d) => d.price > 0).length;
    const validVolumes = data.filter((d) => d.volume > 0).length;

    return {
      totalDataPoints: totalPoints,
      validPrices,
      validVolumes,
      qualityScore: Math.round((validPrices / totalPoints) * 100),
      completeness: Math.round(
        ((validPrices + validVolumes) / (totalPoints * 2)) * 100
      ),
      recommendation: this.getDataQualityRecommendation(totalPoints),
    };
  }

  private getDataQualityRecommendation(dataPoints: number): string {
    if (dataPoints >= 250)
      return "Datos súper completos - Ideal para análisis avanzado y predicciones";
    if (dataPoints >= 90)
      return "Datos profesionales - Excelente para análisis técnico detallado";
    if (dataPoints >= 30)
      return "Datos básicos - Suficiente para análisis general y tendencias";
    return "Datos limitados - Considere obtener más datos históricos";
  }
}
