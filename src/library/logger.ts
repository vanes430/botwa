import { writeToFile } from "./file-logger.js";

enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

function formatTimestamp(): string {
  const now = new Date();
  return now.toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const timestamp = formatTimestamp();
  const prefix = `[${timestamp}] [${level}]`;

  switch (level) {
    case LogLevel.INFO:
      console.log(`${prefix} ${message}`);
      break;
    case LogLevel.WARN:
      console.warn(`${prefix} ${message}`);
      break;
    case LogLevel.ERROR:
      console.error(`${prefix} ${message}`);
      break;
    case LogLevel.DEBUG:
      console.debug(`${prefix} ${message}`);
      break;
  }

  writeToFile(level, message);

  if (meta !== undefined) {
    console.log(JSON.stringify(meta, null, 2));
    writeToFile(level, JSON.stringify(meta, null, 2));
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>): void => {
    log(LogLevel.INFO, message, meta);
  },
  warn: (message: string, meta?: Record<string, unknown>): void => {
    log(LogLevel.WARN, message, meta);
  },
  error: (message: string, meta?: Record<string, unknown>): void => {
    log(LogLevel.ERROR, message, meta);
  },
  debug: (message: string, meta?: Record<string, unknown>): void => {
    log(LogLevel.DEBUG, message, meta);
  },
};
