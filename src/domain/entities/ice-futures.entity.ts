export interface IceFuturesData {
  date: string;
  time: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  openInterest: number;
  high: number;
  low: number;
  settlement: number;
  timestamp: number;
}

export interface IceFuturesHistory {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  lastUpdate: string;
  dataPoints: number;
  timeRange: "1M" | "3M" | "6M" | "1Y";
  data: IceFuturesData[];
  statistics?: {
    avgPrice: number;
    maxPrice: number;
    minPrice: number;
    volatility: number;
    trend: "BULLISH" | "BEARISH" | "NEUTRAL";
    priceChange30d: number;
    volumeAvg: number;
  };
  source: {
    url: string;
    scrapeTime: string;
  };
}
