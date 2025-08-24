import { Router } from "express";
import { LiveStatisticsController } from "../controllers/live-statistics.controller";

export class LiveStatisticsRoutes {
  constructor(
    private readonly liveStatisticsController: LiveStatisticsController
  ) {}

  getRoutes(): Router {
    const router = Router();

    router.get("/estadisticas-en-vivo", (req, res) =>
      this.liveStatisticsController.getLiveStatistics(req, res)
    );

    return router;
  }
}
