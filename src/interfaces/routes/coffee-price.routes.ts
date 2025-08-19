import { Router } from "express";
import { CoffeePriceController } from "../controllers/coffee-price.controller";

export class CoffeePriceRoutes {
  constructor(private readonly coffeePriceController: CoffeePriceController) {}

  getRoutes(): Router {
    const router = Router();

    router.get("/precio-hoy", (req, res) =>
      this.coffeePriceController.getCoffeePriceToday(req, res)
    );

    return router;
  }
}
