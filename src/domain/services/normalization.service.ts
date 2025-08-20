import { CoffeePriceIndicator } from "../entities/coffee-price.entity";
import { ScrapingError } from "../errors/app.errors";

export class NormalizationService {
  static normalizeCoffeePrice(scrapedData: any): CoffeePriceIndicator {
    try {
      const precioInterno = this.formatPrecioInterno(
        scrapedData.precioInternoReferencia
      );
      const bolsaNY = this.formatBolsaNY(scrapedData.bolsaNY);
      const tasaCambio = this.formatTasaCambio(scrapedData.tasaCambio);
      const mecic = this.formatMecic(scrapedData.mecic);

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

  private static formatPrecioInterno(value: string): string {
    if (!value) return "0";
    const cleanValue = value.replace(/[$\s]/g, "").trim();

    if (cleanValue.match(/^\d{1,3}(\.\d{3})*$/)) {
      return cleanValue;
    }

    const numericValue = cleanValue.replace(/[^\d]/g, "");
    if (numericValue) {
      return this.addThousandSeparators(numericValue);
    }

    return "0";
  }

  private static formatBolsaNY(value: string): string {
    if (!value) return "0,00";

    const match = value.match(/\d+[,.]?\d*/);
    if (!match) return "0,00";

    const cleanValue = match[0];

    if (cleanValue.includes(",")) {
      const parts = cleanValue.split(",");
      const decimals = parts[1] || "00";
      return (
        parts[0] +
        "," +
        (decimals.length === 1 ? decimals + "0" : decimals.substring(0, 2))
      );
    }

    if (cleanValue.includes(".")) {
      const parts = cleanValue.split(".");
      const decimals = parts[1] || "00";
      return (
        parts[0] +
        "," +
        (decimals.length === 1 ? decimals + "0" : decimals.substring(0, 2))
      );
    }

    return cleanValue + ",00";
  }

  private static formatTasaCambio(value: string): string {
    if (!value) return "0,00";

    let cleanValue = value.replace(/[$\s]/g, "");

    const match = cleanValue.match(/\d+[.,]?\d*[.,]?\d*/);
    if (!match) return "0,00";

    cleanValue = match[0];

    if (cleanValue.match(/^\d{1,3}\.\d{3},\d{1,2}$/)) {
      const parts = cleanValue.split(",");
      const decimalPart = parts[1];
      if (decimalPart.length === 1) {
        return parts[0] + "," + decimalPart + "0";
      }
      return cleanValue;
    }

    cleanValue = cleanValue.replace(/\.{2,}/g, ".");

    if (cleanValue.includes(",")) {
      const commaIndex = cleanValue.lastIndexOf(",");
      const beforeComma = cleanValue.substring(0, commaIndex);
      const afterComma = cleanValue.substring(commaIndex + 1);

      const integerPart = beforeComma.replace(/\./g, "");
      const formattedInteger = this.addThousandSeparators(integerPart);

      const formattedDecimal = afterComma.substring(0, 2).padEnd(2, "0");

      return formattedInteger + "," + formattedDecimal;
    }

    if (cleanValue.includes(".")) {
      const integerPart = cleanValue.replace(/\./g, "");
      return this.addThousandSeparators(integerPart) + ",00";
    }

    return this.addThousandSeparators(cleanValue) + ",00";
  }

  private static formatMecic(value: string): string {
    if (!value) return "0";

    const cleanValue = value.replace(/[$\s]/g, "").trim();

    if (cleanValue === "0" || cleanValue === "") {
      return "0";
    }

    const numericValue = cleanValue.replace(/[^\d]/g, "");
    return this.addThousandSeparators(numericValue);
  }

  private static addThousandSeparators(value: string): string {
    const reversed = value.split("").reverse();
    const withSeparators = [];

    for (let i = 0; i < reversed.length; i++) {
      if (i > 0 && i % 3 === 0) {
        withSeparators.push(".");
      }
      withSeparators.push(reversed[i]);
    }

    return withSeparators.reverse().join("");
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
