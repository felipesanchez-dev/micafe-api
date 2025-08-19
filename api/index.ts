import { App } from "../src/app";

const app = new App();
const expressApp = app.getApp();

// Export the Express app directly for Vercel
module.exports = expressApp;
export default expressApp;
