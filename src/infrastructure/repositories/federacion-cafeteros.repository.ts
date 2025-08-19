import axios, { AxiosInstance } from "axios";
import * as cheerio from "cheerio";
import { CoffeePriceRepository } from "../../domain/interfaces/services.interface";
import { ScrapedData } from "../../domain/entities/coffee-price.entity";
import { NetworkError, ScrapingError } from "../../domain/errors/app.errors";
import { Logger } from "../../domain/interfaces/services.interface";

export class FederacionCafeterosRepository implements CoffeePriceRepository {
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly baseUrl: string,
    private readonly logger: Logger,
    private readonly timeoutMs: number = 10000,
    private readonly maxRetries: number = 3,
    private readonly retryDelayMs: number = 1000
  ) {
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeoutMs,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });
  }

  async scrapeCoffeePrice(): Promise<ScrapedData> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.info(`Scraping attempt ${attempt}/${this.maxRetries}`);

        const response = await this.httpClient.get("/");
        const $ = cheerio.load(response.data);

        return this.extractCoffeePriceData($);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Attempt ${attempt} failed:`, error);

        if (attempt < this.maxRetries) {
          this.logger.info(`Waiting ${this.retryDelayMs}ms before retry...`);
          await this.delay(this.retryDelayMs);
        }
      }
    }

    if (lastError) {
      if (axios.isAxiosError(lastError)) {
        throw new NetworkError(
          `Network error after ${this.maxRetries} attempts`,
          `${lastError.code}: ${lastError.message}`
        );
      }
      throw new ScrapingError(
        `Scraping failed after ${this.maxRetries} attempts`,
        lastError.message
      );
    }

    throw new ScrapingError("Unknown scraping error");
  }

  private extractCoffeePriceData($: cheerio.CheerioAPI): ScrapedData {
    try {
      const listContainer = $(".col-12.lista-container ul.lista");

      if (listContainer.length === 0) {
        throw new Error("Lista container not found");
      }

      const data: Partial<ScrapedData> = {};

      const precioInternoLi = listContainer
        .find("li")
        .filter((_, el) => {
          return $(el)
            .find(".name")
            .text()
            .toLowerCase()
            .includes("precio interno");
        })
        .first();

      if (precioInternoLi.length > 0) {
        data.precioInternoReferencia = precioInternoLi
          .find("strong")
          .text()
          .trim();
        const detailText = precioInternoLi.find(".detail").text();
        data.precioInternoFecha = this.extractDateFromDetail(detailText);
        data.pdfUrl = precioInternoLi.find(".detail a").attr("href");
      }

      const bolsaLi = listContainer
        .find("li")
        .filter((_, el) => {
          return $(el)
            .find(".name")
            .text()
            .toLowerCase()
            .includes("bolsa de ny");
        })
        .first();

      if (bolsaLi.length > 0) {
        data.bolsaNY = bolsaLi.find("strong").text().trim();
        const detailText = bolsaLi.find(".detail").text();
        data.bolsaFecha = this.extractDateFromDetail(detailText);
      }

      const tasaLi = listContainer
        .find("li")
        .filter((_, el) => {
          return $(el)
            .find(".name")
            .text()
            .toLowerCase()
            .includes("tasa de cambio");
        })
        .first();

      if (tasaLi.length > 0) {
        data.tasaCambio = tasaLi.find("strong").text().trim();
        const detailText = tasaLi.find(".detail").text();
        data.tasaFecha = this.extractDateFromDetail(detailText);
      }

      const mecicLi = listContainer
        .find("li")
        .filter((_, el) => {
          return $(el).find(".name").text().toLowerCase().includes("mecic");
        })
        .first();

      if (mecicLi.length > 0) {
        data.mecic = mecicLi.find("strong").text().trim();
        const detailText = mecicLi.find(".detail").text();
        data.mecicFecha = this.extractDateFromDetail(detailText);
      }

      if (!data.precioInternoReferencia || !data.bolsaNY || !data.tasaCambio) {
        throw new Error("Missing essential price data");
      }

      return data as ScrapedData;
    } catch (error) {
      throw new ScrapingError(
        "Error extracting coffee price data from HTML",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private extractDateFromDetail(detailText: string): string {
    const dateMatch = detailText.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return dateMatch[1];
    }

    return new Date().toISOString().split("T")[0];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
