import { App } from "../src/app";

const app = new App();
const expressApp = app.getApp();

module.exports = expressApp;
export default expressApp;
