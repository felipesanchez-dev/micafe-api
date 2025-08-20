export interface CoffeePriceIndicator {
  precioInternoReferencia: {
    valor: string;
    moneda: string;
    fecha: string;
  };
  bolsaNY: {
    valor: string;
    unidad: string;
    fecha: string;
  };
  tasaCambio: {
    valor: string;
    moneda: string;
    fecha: string;
  };
  mecic: {
    valor: string;
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
