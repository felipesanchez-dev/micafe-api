import { Request, Response } from "express";
import { CoffeePriceController } from "../../interfaces/controllers/coffee-price.controller";
import { GetCoffeePriceUseCase } from "../../application/use-cases/get-coffee-price.use-case";
import {
  AppError,
  ScrapingError,
  ValidationError,
} from "../../domain/errors/app.errors";
import { Logger } from "../../domain/interfaces/services.interface";
import { CoffeePriceIndicator } from "../../domain/entities/coffee-price.entity";

describe("CoffeePriceController", () => {
  let controller: CoffeePriceController;
  let mockUseCase: jest.Mocked<GetCoffeePriceUseCase>;
  let mockLogger: jest.Mocked<Logger>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const mockCoffeePriceData: CoffeePriceIndicator = {
    precioInternoReferencia: {
      valor: 1000000,
      moneda: "COP",
      fecha: "2023-01-01",
    },
    bolsaNY: {
      valor: 150.5,
      unidad: "cUSD/lb",
      fecha: "2023-01-01",
    },
    tasaCambio: {
      valor: 4500,
      moneda: "COP/USD",
      fecha: "2023-01-01",
    },
    mecic: {
      valor: 1200000,
      fecha: "2023-01-01",
    },
    fuente: {
      url: "https://federaciondecafeteros.org",
    },
  };

  beforeEach(() => {
    mockUseCase = {
      execute: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {};
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    controller = new CoffeePriceController(mockUseCase, mockLogger);

    jest
      .spyOn(Date.prototype, "toISOString")
      .mockReturnValue("2023-01-01T00:00:00.000Z");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getCoffeePriceToday", () => {
    describe("Success cases", () => {
      it("should return coffee price data successfully", async () => {
        mockUseCase.execute.mockResolvedValue(mockCoffeePriceData);

        await controller.getCoffeePriceToday(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(mockLogger.info).toHaveBeenCalledWith(
          "GET /precio-hoy - Coffee price request received"
        );
        expect(mockUseCase.execute).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith(
          "GET /precio-hoy - Success response sent"
        );
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          success: true,
          message: "Precio obtenido exitosamente",
          data: mockCoffeePriceData,
          timestamp: "2023-01-01T00:00:00.000Z",
          version: "1.0.0",
          author: "Juan Felipe Reyes Sanchez",
          github: "https://github.com/felipesanchez-dev",
        });
      });
    });

    describe("Error handling", () => {
      it("should handle ScrapingError correctly", async () => {
        const scrapingError = new ScrapingError(
          "Scraping failed",
          "Network timeout"
        );
        mockUseCase.execute.mockRejectedValue(scrapingError);

        await controller.getCoffeePriceToday(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(mockLogger.error).toHaveBeenCalledWith(
          "GET /precio-hoy - Error occurred:",
          scrapingError
        );
        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          message: "Scraping failed",
          error: {
            code: "SCRAPE_FAILED",
            detail: "Network timeout",
          },
          timestamp: "2023-01-01T00:00:00.000Z",
          version: "1.0.0",
          author: "Juan Felipe Reyes Sanchez",
          github: "https://github.com/felipesanchez-dev",
        });
      });

      it("should handle ValidationError correctly", async () => {
        const validationError = new ValidationError(
          "Invalid input",
          "Required field missing"
        );
        mockUseCase.execute.mockRejectedValue(validationError);

        await controller.getCoffeePriceToday(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(mockLogger.error).toHaveBeenCalledWith(
          "GET /precio-hoy - Error occurred:",
          validationError
        );
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          message: "Invalid input",
          error: {
            code: "VALIDATION_ERROR",
            detail: "Required field missing",
          },
          timestamp: "2023-01-01T00:00:00.000Z",
          version: "1.0.0",
          author: "Juan Felipe Reyes Sanchez",
          github: "https://github.com/felipesanchez-dev",
        });
      });

      it("should handle generic Error correctly", async () => {
        const genericError = new Error("Unexpected error");
        mockUseCase.execute.mockRejectedValue(genericError);

        await controller.getCoffeePriceToday(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(mockLogger.error).toHaveBeenCalledWith(
          "GET /precio-hoy - Error occurred:",
          genericError
        );
        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          message: "Unexpected error",
          error: {
            code: "INTERNAL_ERROR",
            detail: "Internal server error",
          },
          timestamp: "2023-01-01T00:00:00.000Z",
          version: "1.0.0",
          author: "Juan Felipe Reyes Sanchez",
          github: "https://github.com/felipesanchez-dev",
        });
      });

      it("should handle non-Error objects", async () => {
        const nonErrorObject = "String error";
        mockUseCase.execute.mockRejectedValue(nonErrorObject);

        await controller.getCoffeePriceToday(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(mockLogger.error).toHaveBeenCalledWith(
          "GET /precio-hoy - Error occurred:",
          nonErrorObject
        );
        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          message: "No fue posible obtener el precio del café",
          error: {
            code: "INTERNAL_ERROR",
            detail: "Internal server error",
          },
          timestamp: "2023-01-01T00:00:00.000Z",
          version: "1.0.0",
          author: "Juan Felipe Reyes Sanchez",
          github: "https://github.com/felipesanchez-dev",
        });
      });

      it("should handle AppError with custom statusCode", async () => {
        const customError = new AppError(
          "Custom error",
          "CUSTOM_ERROR",
          404,
          "Resource not found"
        );
        mockUseCase.execute.mockRejectedValue(customError);

        await controller.getCoffeePriceToday(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          message: "Custom error",
          error: {
            code: "CUSTOM_ERROR",
            detail: "Resource not found",
          },
          timestamp: "2023-01-01T00:00:00.000Z",
          version: "1.0.0",
          author: "Juan Felipe Reyes Sanchez",
          github: "https://github.com/felipesanchez-dev",
        });
      });
    });
  });
});
