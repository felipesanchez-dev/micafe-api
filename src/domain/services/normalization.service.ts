import { CoffeePriceIndicator } from "../entities/coffee-price.entity";
import { ScrapingError } from "../errors/app.errors";

export class NormalizationService {
  static normalizeCoffeePrice(scrapedData: any): CoffeePriceIndicator {
    try {
      const precioInterno = this.extractNumericValue(
        scrapedData.precioInternoReferencia
      );
      const bolsaNY = this.extractDecimalValue(scrapedData.bolsaNY);
      const tasaCambio = this.extractNumericValue(scrapedData.tasaCambio);
      const mecic = this.extractNumericValue(scrapedData.mecic);

      return {
        precioInternoReferencia: {
          valor: precioInterno,
          moneda: "COP",
          fecha: this.formatDate(scrapedData.precioInternoFecha),
        },
        bolsaNY: {
          valor: bolsaNY,
          unidad: "cents/lb",
          fecha: this.formatDate(scrapedData.bolsaFecha),
        },
        tasaCambio: {
          valor: tasaCambio,
          moneda: "COP/USD",
          fecha: this.formatDate(scrapedData.tasaFecha),
        },
        mecic: {
          valor: mecic,
          fecha: this.formatDate(scrapedData.mecicFecha),
        },
        fuente: {
          url: "https://federaciondecafeteros.org",
          pdfPrecio: scrapedData.pdfUrl,
        },
      };
    } catch (error) {
      throw new ScrapingError(
        "Error normalizing scraped data",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private static extractNumericValue(value: string): number {
    if (!value) return 0;
    const cleanValue = value.replace(/[^\d,]/g, "");
    const normalizedValue = cleanValue.replace(",", ".");
    return parseInt(normalizedValue.replace(".", ""), 10) || 0;
  }

  private static extractDecimalValue(value: string): number {
    if (!value) return 0;
    const normalizedValue = value.replace(",", ".");
    return parseFloat(normalizedValue.replace(/[^\d.]/g, "")) || 0;
  }

  private static formatDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString().split("T")[0];

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split("T")[0];
      }
      return date.toISOString().split("T")[0];
    } catch {
      return new Date().toISOString().split("T")[0];
    }
  }
}
