import { Request, Response } from "express";
import { GetCoffeePriceUseCase } from "../../application/use-cases/get-coffee-price.use-case";
import { ApiResponse } from "../dto/api-response.dto";
import { AppError } from "../../domain/errors/app.errors";
import { Logger } from "../../domain/interfaces/services.interface";

export class CoffeePriceController {
  constructor(
    private readonly getCoffeePriceUseCase: GetCoffeePriceUseCase,
    private readonly logger: Logger
  ) {}

  async getCoffeePriceToday(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info("GET /precio-hoy - Coffee price request received");

      const coffeePriceData = await this.getCoffeePriceUseCase.execute();

      const response: ApiResponse = {
        success: true,
        message: "Precio obtenido exitosamente",
        data: coffeePriceData,
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        author: "Juan Felipe Reyes Sanchez",
        github: "https://github.com/felipesanchez-dev",
      };

      this.logger.info("GET /precio-hoy - Success response sent");
      res.status(200).json(response);
    } catch (error) {
      this.logger.error("GET /precio-hoy - Error occurred:", error);

      const isAppError = error instanceof AppError;
      const statusCode = isAppError ? error.statusCode : 500;
      const errorCode = isAppError ? error.code : "INTERNAL_ERROR";
      const errorDetail = isAppError ? error.detail : "Internal server error";

      const response: ApiResponse = {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "No fue posible obtener el precio del café",
        error: {
          code: errorCode,
          detail: errorDetail,
        },
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        author: "Juan Felipe Reyes Sanchez",
        github: "https://github.com/felipesanchez-dev",
      };

      res.status(statusCode).json(response);
    }
  }
}
