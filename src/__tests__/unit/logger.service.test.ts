import { PinoLogger } from "../../infrastructure/services/logger.service";

// Mock pino
jest.mock("pino", () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  return jest.fn(() => mockLogger);
});

describe("PinoLogger", () => {
  let logger: PinoLogger;
  let mockPino: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const pino = require("pino");
    mockPino = pino();
    logger = new PinoLogger();
  });

  describe("info", () => {
    it("should call pino info with message only", () => {
      logger.info("Test info message");
      expect(mockPino.info).toHaveBeenCalledWith("Test info message");
    });

    it("should call pino info with message and meta", () => {
      const meta = { userId: 123 };
      logger.info("Test info message", meta);
      expect(mockPino.info).toHaveBeenCalledWith(meta, "Test info message");
    });

    it("should handle empty message", () => {
      logger.info("");
      expect(mockPino.info).toHaveBeenCalledWith("");
    });
  });

  describe("warn", () => {
    it("should call pino warn with message only", () => {
      logger.warn("Test warn message");
      expect(mockPino.warn).toHaveBeenCalledWith("Test warn message");
    });

    it("should call pino warn with message and meta", () => {
      const meta = { warning: "deprecated" };
      logger.warn("Test warn message", meta);
      expect(mockPino.warn).toHaveBeenCalledWith(meta, "Test warn message");
    });
  });

  describe("error", () => {
    it("should call pino error with message only", () => {
      logger.error("Test error message");
      expect(mockPino.error).toHaveBeenCalledWith("Test error message");
    });

    it("should call pino error with message and meta", () => {
      const meta = { error: "critical", stack: "test stack" };
      logger.error("Test error message", meta);
      expect(mockPino.error).toHaveBeenCalledWith(meta, "Test error message");
    });
  });

  describe("debug", () => {
    it("should call pino debug with message only", () => {
      logger.debug("Test debug message");
      expect(mockPino.debug).toHaveBeenCalledWith("Test debug message");
    });

    it("should call pino debug with message and meta", () => {
      const meta = { debugInfo: "test" };
      logger.debug("Test debug message", meta);
      expect(mockPino.debug).toHaveBeenCalledWith(meta, "Test debug message");
    });
  });

  describe("constructor", () => {
    it("should create logger with default level", () => {
      const pino = require("pino");
      new PinoLogger();

      expect(pino).toHaveBeenCalledWith({
        level: "info",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "UTC:yyyy-mm-dd HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      });
    });

    it("should create logger with custom level", () => {
      const pino = require("pino");
      new PinoLogger("debug");

      expect(pino).toHaveBeenCalledWith({
        level: "debug",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "UTC:yyyy-mm-dd HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      });
    });
  });
});
