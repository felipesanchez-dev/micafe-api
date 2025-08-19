import request from "supertest";
import { App } from "../../app";

describe("API Endpoints E2E", () => {
  let app: App;

  beforeAll(() => {
    app = new App();
  });

  describe("GET /", () => {
    it("should return API metadata", async () => {
      const response = await request(app.getApp()).get("/").expect(200);

      expect(response.body).toMatchObject({
        name: "MiCafe API",
        version: "1.0.0",
        description: "API para obtener indicadores del café de Colombia",
        author: "Juan Felipe Reyes Sanchez",
        github: "https://github.com/felipesanchez-dev",
        endpoints: {
          "/": "Información del servicio",
          "/status": "Estado de scraping y salud",
          "/precio-hoy": "Obtiene el precio de café de hoy vía scraping",
        },
        status: "online",
        retrySystem: "Enabled (3 attempts)",
      });

      expect(response.body.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
      );
    });
  });

  describe("GET /status", () => {
    it("should return service status", async () => {
      const response = await request(app.getApp()).get("/status").expect(200);

      expect(response.body).toMatchObject({
        status: "healthy",
        version: "1.0.0",
      });

      expect(typeof response.body.uptime).toBe("number");
      expect(response.body.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
      );
    });
  });

  describe("GET /precio-hoy", () => {
    it("should return coffee price data structure", async () => {
      const response = await request(app.getApp())
        .get("/precio-hoy")
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Precio obtenido exitosamente",
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
        ),
        version: "1.0.0",
        author: "Juan Felipe Reyes Sanchez",
        github: "https://github.com/felipesanchez-dev",
      });

      expect(response.body.data).toMatchObject({
        precioInternoReferencia: {
          moneda: "COP",
          fecha: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        },
        bolsaNY: {
          unidad: "cents/lb",
          fecha: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        },
        tasaCambio: {
          moneda: "COP/USD",
          fecha: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        },
        mecic: {
          fecha: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        },
        fuente: {
          url: "https://federaciondecafeteros.org",
        },
      });

      expect(typeof response.body.data.precioInternoReferencia.valor).toBe(
        "number"
      );
      expect(typeof response.body.data.bolsaNY.valor).toBe("number");
      expect(typeof response.body.data.tasaCambio.valor).toBe("number");
      expect(typeof response.body.data.mecic.valor).toBe("number");
    }, 15000);
  });

  describe("GET /non-existent", () => {
    it("should return 404 for non-existent endpoints", async () => {
      const response = await request(app.getApp())
        .get("/non-existent")
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "Endpoint not found",
        error: {
          code: "NOT_FOUND",
          detail: "Path /non-existent not found",
        },
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
        ),
        version: "1.0.0",
        author: "Juan Felipe Reyes Sanchez",
        github: "https://github.com/felipesanchez-dev",
      });
    });
  });
});
