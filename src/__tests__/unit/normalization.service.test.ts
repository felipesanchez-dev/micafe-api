import { NormalizationService } from "../../domain/services/normalization.service";
import {
  scrapedDataFixture,
  expectedNormalizedData,
} from "../fixtures/html.fixture";

describe("NormalizationService", () => {
  describe("normalizeCoffeePrice", () => {
    it("should normalize scraped data correctly", () => {
      const result =
        NormalizationService.normalizeCoffeePrice(scrapedDataFixture);

      expect(result).toEqual(expectedNormalizedData);
    });

    it("should handle missing precio interno referencia", () => {
      const incompleteData = {
        ...scrapedDataFixture,
        precioInternoReferencia: "",
      };

      const result = NormalizationService.normalizeCoffeePrice(incompleteData);

      expect(result.precioInternoReferencia.valor).toBe(0);
    });

    it("should handle missing bolsa NY", () => {
      const incompleteData = { ...scrapedDataFixture, bolsaNY: "" };

      const result = NormalizationService.normalizeCoffeePrice(incompleteData);

      expect(result.bolsaNY.valor).toBe(0);
    });

    it("should handle invalid date format", () => {
      const invalidDateData = {
        ...scrapedDataFixture,
        precioInternoFecha: "invalid-date",
      };

      const result = NormalizationService.normalizeCoffeePrice(invalidDateData);

      expect(result.precioInternoReferencia.fecha).toMatch(
        /^\d{4}-\d{2}-\d{2}$/
      );
    });

    it("should extract numeric values correctly from currency strings", () => {
      const testData = {
        ...scrapedDataFixture,
        precioInternoReferencia: "$2.780.000",
        tasaCambio: "$4.015",
        mecic: "$0",
      };

      const result = NormalizationService.normalizeCoffeePrice(testData);

      expect(result.precioInternoReferencia.valor).toBe(2780000);
      expect(result.tasaCambio.valor).toBe(4015);
      expect(result.mecic.valor).toBe(0);
    });

    it("should extract decimal values correctly", () => {
      const testData = {
        ...scrapedDataFixture,
        bolsaNY: "343,60",
      };

      const result = NormalizationService.normalizeCoffeePrice(testData);

      expect(result.bolsaNY.valor).toBe(343.6);
    });
  });
});
