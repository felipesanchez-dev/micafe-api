import { App } from "./app";

const app = new App();

if (process.env.NODE_ENV !== "production") {
  app.start();
}

export default app.getApp();
