import { VercelRequest, VercelResponse } from '@vercel/node';
import { App } from "../src/app";

let app: App | null = null;

const initializeApp = () => {
  try {
    if (!app) {
      console.log('Inicializando aplicación MiCafe...');
      app = new App();
      console.log('Aplicación MiCafe inicializada correctamente');
    }
    return app.getApp();
  } catch (error) {
    console.error('Error inicializando la aplicación:', error);
    throw error;
  }
};

export default (req: VercelRequest, res: VercelResponse) => {
  try {
    const expressApp = initializeApp();
    return expressApp(req, res);
  } catch (error) {
    console.error('Error en el handler de Vercel:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};