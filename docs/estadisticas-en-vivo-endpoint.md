# Endpoint de Estadísticas en Vivo

## Descripción
El endpoint `/estadisticas-en-vivo` proporciona datos históricos y en tiempo real de los futuros de café de ICE (Intercontinental Exchange) para análisis técnico y monitoreo de precios.

## URL
```
GET /estadisticas-en-vivo
```

## Parámetros de Consulta

### range (opcional)
- **Tipo**: String
- **Valores válidos**: `1M`, `3M`, `6M`, `1Y`
- **Por defecto**: `1M`
- **Descripción**: Define el rango de tiempo de los datos históricos

#### Rangos de Tiempo:
- `1M` (1 mes): ~30 datos - Básico para análisis general y tendencias
- `3M` (3 meses): ~90 datos - Interesante para análisis técnico 
- `6M` (6 meses): ~180 datos - Profesional para análisis detallado
- `1Y` (1 año): ~250 datos - Súper completo para análisis avanzado y predicciones

## Respuesta Exitosa

### Estructura de Respuesta
```json
{
  "success": true,
  "message": "Estadísticas en vivo obtenidas exitosamente para período 1M",
  "data": {
    "symbol": "KC",
    "name": "Coffee C Futures",
    "exchange": "ICE",
    "currency": "USD",
    "lastUpdate": "2025-08-24T02:20:33.000Z",
    "dataPoints": 30,
    "timeRange": "1M",
    "data": [
      {
        "date": "2025-07-25",
        "time": "14:30:00",
        "price": 165.25,
        "change": 2.15,
        "changePercent": 1.32,
        "volume": 8547,
        "openInterest": 75432,
        "high": 168.40,
        "low": 163.10,
        "settlement": 165.25,
        "timestamp": 1721916600000
      }
      // ... más datos
    ],
    "statistics": {
      "avgPrice": 164.78,
      "maxPrice": 175.20,
      "minPrice": 152.30,
      "volatility": 8.45,
      "trend": "BULLISH",
      "priceChange30d": 5.2,
      "volumeAvg": 9250
    },
    "source": {
      "url": "https://www.ice.com/products/15/Coffee-C-Futures/data",
      "scrapeTime": "2025-08-24T02:20:33.000Z"
    },
    "dataQuality": {
      "totalDataPoints": 30,
      "validPrices": 30,
      "validVolumes": 30,
      "qualityScore": 100,
      "completeness": 100,
      "recommendation": "Datos básicos - Suficiente para análisis general y tendencias"
    },
    "metadata": {
      "requestId": "req_1756001633123",
      "processingTime": "1250ms",
      "dataFreshness": "Muy reciente",
      "nextUpdate": "2025-08-24T02:30:33.000Z",
      "apiVersion": "1.0.0",
      "endpoints": {
        "refresh": "/estadisticas-en-vivo?range=1M&force=true",
        "historical": "/estadisticas-en-vivo?range=1Y",
        "realTime": "/estadisticas-en-vivo?range=1M"
      }
    }
  },
  "timestamp": "2025-08-24T02:20:33.000Z",
  "version": "1.0.0",
  "author": "Juan Felipe Reyes Sanchez",
  "github": "https://github.com/felipesanchez-dev"
}
```

## Campos de Datos

### Información del Instrumento
- `symbol`: Símbolo del futuro (KC = Coffee C)
- `name`: Nombre completo del instrumento
- `exchange`: Bolsa de valores (ICE)
- `currency`: Moneda de cotización (USD)

### Datos de Precios (por cada punto de datos)
- `date`: Fecha de la cotización (YYYY-MM-DD)
- `time`: Hora de la cotización (HH:MM:SS)
- `price`: Precio de cierre (centavos por libra)
- `change`: Cambio absoluto vs día anterior
- `changePercent`: Cambio porcentual vs día anterior
- `volume`: Volumen de contratos negociados
- `openInterest`: Interés abierto total
- `high`: Precio más alto del día
- `low`: Precio más bajo del día
- `settlement`: Precio de liquidación
- `timestamp`: Timestamp Unix de la cotización

### Estadísticas Calculadas
- `avgPrice`: Precio promedio del período
- `maxPrice`: Precio máximo del período
- `minPrice`: Precio mínimo del período
- `volatility`: Volatilidad calculada (desviación estándar)
- `trend`: Tendencia general (BULLISH/BEARISH/NEUTRAL)
- `priceChange30d`: Cambio porcentual en 30 días
- `volumeAvg`: Volumen promedio diario

### Calidad de Datos
- `totalDataPoints`: Total de puntos de datos
- `validPrices`: Precios válidos (no nulos/cero)
- `qualityScore`: Puntuación de calidad (0-100)
- `recommendation`: Recomendación basada en cantidad de datos

## Ejemplos de Uso

### Obtener datos básicos (1 mes)
```bash
curl "http://localhost:3000/estadisticas-en-vivo"
curl "http://localhost:3000/estadisticas-en-vivo?range=1M"
```

### Obtener datos profesionales (6 meses)
```bash
curl "http://localhost:3000/estadisticas-en-vivo?range=6M"
```

### Obtener datos súper completos (1 año)
```bash
curl "http://localhost:3000/estadisticas-en-vivo?range=1Y"
```

## Respuestas de Error

### Error de Validación (400)
```json
{
  "success": false,
  "message": "Parámetro 'range' inválido",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "detail": "Los valores válidos son: 1M, 3M, 6M, 1Y",
    "requestId": "req_123456789",
    "suggestions": [
      "Verifique que los parámetros de la solicitud sean correctos",
      "Consulte la documentación de la API para parámetros válidos"
    ]
  }
}
```

### Error de Scraping (500)
```json
{
  "success": false,
  "message": "Error al generar datos de estadísticas de ICE",
  "data": null,
  "error": {
    "code": "SCRAPE_FAILED",
    "detail": "Timeout al acceder a la fuente de datos",
    "requestId": "req_123456789",
    "suggestions": [
      "Intente nuevamente en unos minutos",
      "Pruebe con un rango de tiempo diferente",
      "Verifique su conexión a internet"
    ]
  }
}
```

## Características Técnicas

### Caché
- **TTL**: 10 minutos
- **Clave**: `ice_futures_{range}`
- **Estrategia**: Cache-first con fallback a generación

### Actualización de Datos
- **Frecuencia**: Cada 10 minutos
- **Fuente**: ICE (Intercontinental Exchange)
- **Fallback**: Datos simulados realistas si la fuente no está disponible

### Rendimiento
- **Tiempo de respuesta típico**: 500-1500ms (primera vez)
- **Tiempo de respuesta con caché**: 50-200ms
- **Límite de datos**: Hasta 250 puntos (1 año)

### Logging y Monitoreo
- Log de solicitudes entrantes
- Log de tiempo de procesamiento
- Log de operaciones de caché
- Métricas de calidad de datos

## Casos de Uso

### Para Gráficas
Los datos están optimizados para ser utilizados directamente en librerías de gráficos:
- Formato consistente de fechas y precios
- Timestamps para ordenación temporal
- Campos high/low para gráficos de velas
- Volumen para gráficos de barras

### Para Análisis Técnico
- Datos de volatilidad calculados
- Tendencias identificadas
- Estadísticas de período completas
- Cambios porcentuales pre-calculados

### Para Dashboards
- Metadatos de frescura de datos
- Recomendaciones de calidad
- Enlaces a endpoints relacionados
- Información de próxima actualización

## Notas Importantes

1. **Datos Simulados**: Actualmente usa datos simulados realistas debido a las protecciones anti-bot de ICE
2. **Volatilidad Realista**: Los datos simulados incluyen volatilidad típica del mercado de café
3. **Actualización Automática**: El sistema refresca los datos automáticamente cada 10 minutos
4. **Escalabilidad**: Diseñado para manejar múltiples rangos de tiempo simultáneamente
