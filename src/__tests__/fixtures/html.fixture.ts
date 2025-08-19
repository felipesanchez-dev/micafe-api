export const htmlFixture = `
<!DOCTYPE html>
<html>
<head>
    <title>Federación Nacional de Cafeteros</title>
</head>
<body>
    <div class="col-12 lista-container">
        <ul class="lista">
            <li class="title"><strong>INDICADORES:</strong></li>
            <li tabindex="1">
                <span class="name">Precio interno de referencia:</span>
                <strong>$2.780.000</strong>
                <span class="detail hidden">
                    <strong>Fecha:</strong> 2025-08-18<br>Precio interno de referencia...
                    <a href="https://federaciondecafeteros.org/app/uploads/2019/10/precio_cafe.pdf" target="_blank">
                        Haz clic para ver el precio del café.
                    </a>
                </span>
            </li>
            <li tabindex="2">
                <span class="name">Bolsa de NY:</span>
                <strong>343,60</strong>
                <span class="detail hidden">
                    <strong>Fecha:</strong> 2025-08-18<br><strong>Bolsa The Ice:</strong>...
                </span>
            </li>
            <li tabindex="3">
                <span class="name">Tasa de cambio:</span>
                <strong>$4.015</strong>
                <span class="detail hidden">
                    <strong>Fecha:</strong> 2025-08-18<br>Para más información...
                </span>
            </li>
            <li tabindex="5">
                <span class="name">MeCIC:</span>
                <strong>$0</strong>
                <span class="detail hidden">
                    <strong>Fecha:</strong> 2024-07-12<br>Este es el valor de la compensación...
                    <a href="https://federaciondecafeteros.org/wp/mecic/" target="_blank">
                        Haga clic para ver mas.
                    </a>
                </span>
            </li>
        </ul>
    </div>
</body>
</html>
`;

export const expectedNormalizedData = {
  precioInternoReferencia: {
    valor: 2780000,
    moneda: "COP",
    fecha: "2025-08-18",
  },
  bolsaNY: {
    valor: 343.6,
    unidad: "cents/lb",
    fecha: "2025-08-18",
  },
  tasaCambio: {
    valor: 4015,
    moneda: "COP/USD",
    fecha: "2025-08-18",
  },
  mecic: {
    valor: 0,
    fecha: "2024-07-12",
  },
  fuente: {
    url: "https://federaciondecafeteros.org",
    pdfPrecio:
      "https://federaciondecafeteros.org/app/uploads/2019/10/precio_cafe.pdf",
  },
};

export const scrapedDataFixture = {
  precioInternoReferencia: "$2.780.000",
  precioInternoFecha: "2025-08-18",
  bolsaNY: "343,60",
  bolsaFecha: "2025-08-18",
  tasaCambio: "$4.015",
  tasaFecha: "2025-08-18",
  mecic: "$0",
  mecicFecha: "2024-07-12",
  pdfUrl:
    "https://federaciondecafeteros.org/app/uploads/2019/10/precio_cafe.pdf",
};
