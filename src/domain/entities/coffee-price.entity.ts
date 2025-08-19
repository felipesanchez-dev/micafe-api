export interface CoffeePriceIndicator {
  precioInternoReferencia: {
    valor: number;
    moneda: string;
    fecha: string;
  };
  bolsaNY: {
    valor: number;
    unidad: string;
    fecha: string;
  };
  tasaCambio: {
    valor: number;
    moneda: string;
    fecha: string;
  };
  mecic: {
    valor: number;
    fecha: string;
  };
  fuente: {
    url: string;
    pdfPrecio?: string;
  };
}

export interface ScrapedData {
  precioInternoReferencia: string;
  precioInternoFecha: string;
  bolsaNY: string;
  bolsaFecha: string;
  tasaCambio: string;
  tasaFecha: string;
  mecic: string;
  mecicFecha: string;
  pdfUrl?: string;
}
