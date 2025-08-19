import pino from "pino";
import { Logger } from "../../domain/interfaces/services.interface";

export class PinoLogger implements Logger {
  private logger: pino.Logger;

  constructor(level: string = "info") {
    this.logger = pino({
      level,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "UTC:yyyy-mm-dd HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      },
    });
  }

  info(message: string, meta?: any): void {
    if (meta) {
      this.logger.info(meta, message);
    } else {
      this.logger.info(message);
    }
  }

  warn(message: string, meta?: any): void {
    if (meta) {
      this.logger.warn(meta, message);
    } else {
      this.logger.warn(message);
    }
  }

  error(message: string, meta?: any): void {
    if (meta) {
      this.logger.error(meta, message);
    } else {
      this.logger.error(message);
    }
  }

  debug(message: string, meta?: any): void {
    if (meta) {
      this.logger.debug(meta, message);
    } else {
      this.logger.debug(message);
    }
  }
}
