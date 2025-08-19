import { Router } from "express";
import { AppController } from "../controllers/app.controller";

export class AppRoutes {
  constructor(private readonly appController: AppController) {}

  getRoutes(): Router {
    const router = Router();

    router.get("/", (req, res) => this.appController.getApiInfo(req, res));

    router.get("/status", (req, res) => this.appController.getStatus(req, res));

    return router;
  }
}
