import * as cheerio from "cheerio";
import * as puppeteer from "puppeteer";
import {
  IceFuturesHistory,
  IceFuturesData,
} from "../../domain/entities/ice-futures.entity";
import { ScrapingError } from "../../domain/errors/app.errors";
import { Logger } from "../../domain/interfaces/services.interface";

export interface IceFuturesRepository {
  getIceFuturesData(timeRange: "1Y"): Promise<IceFuturesHistory>;
}

export class IceFuturesRepositoryImpl implements IceFuturesRepository {
  private readonly baseUrl =
    "https://www.ice.com/products/15/Coffee-C-Futures/data";
  private readonly timeout = 15000;
  private readonly maxRetries = 3;

  constructor(private readonly logger: Logger) {}

  private calculateStatistics(data: IceFuturesData[]) {
    if (data.length === 0) {
      return undefined;
    }

    const prices = data.map((d) => d.price);
    const volumes = data.map((d) => d.volume);

    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const volumeAvg = volumes.reduce((a, b) => a + b, 0) / volumes.length;

    const variance =
      prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) /
      prices.length;
    const volatility = Math.sqrt(variance);

    const recentPrices = data.slice(-10).map((d) => d.price);
    const oldPrices = data.slice(0, 10).map((d) => d.price);
    const recentAvg =
      recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const oldAvg = oldPrices.reduce((a, b) => a + b, 0) / oldPrices.length;

    let trend: "BULLISH" | "BEARISH" | "NEUTRAL";
    const trendDiff = ((recentAvg - oldAvg) / oldAvg) * 100;

    if (trendDiff > 2) trend = "BULLISH";
    else if (trendDiff < -2) trend = "BEARISH";
    else trend = "NEUTRAL";

    const priceChange30d =
      data.length >= 30
        ? ((data[data.length - 1].price - data[data.length - 30].price) /
            data[data.length - 30].price) *
          100
        : 0;

    return {
      avgPrice: Number(avgPrice.toFixed(2)),
      maxPrice,
      minPrice,
      volatility: Number(volatility.toFixed(2)),
      trend,
      priceChange30d: Number(priceChange30d.toFixed(2)),
      volumeAvg: Number(volumeAvg.toFixed(0)),
    };
  }

  private async fetchPageWithRetry(
    url: string,
    retries: number = 0
  ): Promise<string> {
    let browser = null;
    try {
      this.logger.info(
        `Fetching ICE data with Puppeteer from: ${url} (attempt ${
          retries + 1
        }/${this.maxRetries})`
      );

      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      });

      const page = await browser.newPage();

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      );

      await page.setViewport({ width: 1366, height: 768 });

      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: this.timeout,
      });

      await page.waitForSelector(".table-bigdata, table", { timeout: 10000 });

      const html = await page.content();

      await browser.close();
      return html;
    } catch (error) {
      if (browser) {
        await browser.close();
      }

      if (retries < this.maxRetries - 1) {
        const delay = Math.pow(2, retries) * 1000;
        this.logger.info(`Request failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchPageWithRetry(url, retries + 1);
      }
      throw error;
    }
  }

  private parseContractDate(contract: string): {
    month: string;
    year: number;
    timestamp: number;
  } {
    const monthMap: { [key: string]: number } = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    const monthStr = contract.substring(0, 3);
    const yearStr = contract.substring(3);
    const year = 2000 + parseInt(yearStr);
    const month = monthMap[monthStr];

    if (month === undefined) {
      throw new Error(`Invalid contract month: ${monthStr}`);
    }

    const date = new Date(year, month, 1);

    return {
      month: monthStr,
      year: year,
      timestamp: date.getTime(),
    };
  }

  private parseTableData(html: string): IceFuturesData[] {
    const $ = cheerio.load(html);
    const data: IceFuturesData[] = [];

    this.logger.info("Parsing ICE futures table data...");

    const table = $(".table-bigdata");
    if (table.length === 0) {
      throw new Error("No se encontró la tabla de datos de ICE");
    }

    table.find("tbody tr").each((index, row) => {
      try {
        const $row = $(row);

        const contractCell = $row.find("td").eq(0);
        const lastCell = $row.find("td").eq(1);
        const timeCell = $row.find("td").eq(2);
        const changeCell = $row.find("td").eq(3);
        const volumeCell = $row.find("td").eq(4);

        const contractText = contractCell.text().trim();
        const contractMatch = contractText.match(/([A-Za-z]{3}\d{2})/);
        if (!contractMatch) {
          this.logger.info(
            `Skipping row with invalid contract: ${contractText}`
          );
          return;
        }
        const contract = contractMatch[1];

        const priceText = lastCell.text().trim();
        const price = parseFloat(priceText);
        if (isNaN(price)) {
          this.logger.info(`Skipping row with invalid price: ${priceText}`);
          return;
        }

        const timeText = timeCell.find("span").text().trim();
        let dateStr = "";
        let timeStr = "";

        if (timeText) {
          const timeMatch = timeText.match(
            /(\d{1,2}\/\d{1,2}\/\d{4})\s*(\d{1,2}:\d{2}\s*[AP]M)/
          );
          if (timeMatch) {
            dateStr = timeMatch[1];
            timeStr = timeMatch[2];
          } else {
            dateStr = new Date().toISOString().split("T")[0];
            timeStr = timeText;
          }
        }

        const changeText = changeCell.text().trim();
        const changePercent = parseFloat(changeText);

        const volumeText = volumeCell.text().trim();
        const volume = parseInt(volumeText.replace(/,/g, "")) || 0;

        const contractInfo = this.parseContractDate(contract);

        const futuresData: IceFuturesData = {
          date: dateStr || new Date().toISOString().split("T")[0],
          time: timeStr || new Date().toTimeString().split(" ")[0],
          price: price,
          change: 0,
          changePercent: isNaN(changePercent) ? 0 : changePercent,
          volume: volume,
          openInterest: 0,
          high: price,
          low: price,
          settlement: price,
          timestamp: contractInfo.timestamp,
          contract: contract,
          contractMonth: contractInfo.month,
          contractYear: contractInfo.year,
        } as IceFuturesData;

        data.push(futuresData);

        this.logger.info(
          `Parsed data point: ${contract} @ ${price} (${changePercent}% change, ${volume} volume)`
        );
      } catch (error) {
        this.logger.info(
          `Error parsing table row ${index}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    });

    data.sort((a, b) => a.timestamp - b.timestamp);

    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];
      current.change = Number((current.price - previous.price).toFixed(3));
    }

    this.logger.info(
      `Successfully parsed ${data.length} data points from ICE table`
    );

    return data;
  }

  async getIceFuturesData(timeRange: "1Y"): Promise<IceFuturesHistory> {
    const startTime = Date.now();

    try {
      this.logger.info(`Starting ICE futures scraping for ${timeRange} range`);

      const html = await this.fetchPageWithRetry(this.baseUrl);
      const scrapedData = this.parseTableData(html);

      if (scrapedData.length === 0) {
        throw new Error("No se pudieron extraer datos de la página de ICE");
      }

      const result: IceFuturesHistory = {
        symbol: "KC",
        name: "Coffee C Futures",
        exchange: "ICE",
        currency: "USD",
        lastUpdate: new Date().toISOString(),
        dataPoints: scrapedData.length,
        timeRange,
        data: scrapedData,
        statistics: this.calculateStatistics(scrapedData),
        source: {
          url: this.baseUrl,
          scrapeTime: new Date().toISOString(),
        },
      };

      const duration = Date.now() - startTime;
      this.logger.info(
        `ICE futures data scraped successfully in ${duration}ms. Found ${scrapedData.length} data points.`
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logError?.(
        `ICE futures scraping failed after ${duration}ms`,
        500,
        "system",
        error instanceof Error ? error.message : String(error)
      );

      throw new ScrapingError(
        "Error al hacer scraping de datos de ICE Futures",
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
