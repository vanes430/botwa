import { spawn } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { logger } from "./logger.js";

interface FileLoggerOptions {
  logDir: string;
  maxFiles: number;
  maxFileSizeKB: number;
}

const DEFAULT_MAX_FILES = 10;
const DEFAULT_MAX_SIZE_KB = 5120;

class FileLogger {
  private logDir: string;
  private latestLog: string;
  private maxFiles: number;
  private maxFileSizeKB: number;

  constructor(options: FileLoggerOptions) {
    this.logDir = resolve(options.logDir);
    this.latestLog = join(this.logDir, "latest.log");
    this.maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
    this.maxFileSizeKB = options.maxFileSizeKB ?? DEFAULT_MAX_SIZE_KB;

    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  write(level: string, message: string): void {
    const timestamp = new Date().toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const line = `[${timestamp}] [${level}] ${message}\n`;

    appendFileSync(this.latestLog, line, "utf-8");

    this.checkRotation();
  }

  private checkRotation(): void {
    if (!existsSync(this.latestLog)) {
      return;
    }

    const sizeBytes = this.getFileSize(this.latestLog);
    const sizeKB = sizeBytes / 1024;

    if (sizeKB >= this.maxFileSizeKB) {
      this.rotate();
    }
  }

  private rotate(): void {
    const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
    const rotatedName = `log-${dateStr}.log`;
    const rotatedPath = join(this.logDir, rotatedName);

    try {
      const content = readFileSync(this.latestLog, "utf-8");
      writeFileSync(rotatedPath, content, "utf-8");
      writeFileSync(this.latestLog, "", "utf-8");

      logger.info(`Log rotated to ${rotatedName}`);

      this.compress(rotatedPath);
      this.cleanupOldLogs();
    } catch (error: unknown) {
      logger.error("Failed to rotate logs", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private compress(filePath: string): void {
    const gzPath = `${filePath}.tar.gz`;

    const tarProcess = spawn("tar", [
      "-czf",
      gzPath,
      "-C",
      this.logDir,
      filePath.split("/").pop()!,
    ]);

    tarProcess.on("close", (code: number | null) => {
      if (code === 0) {
        unlinkSync(filePath);
        logger.info(`Compressed log: ${gzPath}`);
      } else {
        logger.error(`Failed to compress log: ${filePath}`, { exitCode: code });
      }
    });

    tarProcess.on("error", (error: Error) => {
      logger.error(`Tar command failed: ${error.message}`);
    });
  }

  private cleanupOldLogs(): void {
    const files = readdirSync(this.logDir)
      .filter((f: string): boolean => f.endsWith(".tar.gz"))
      .sort();

    while (files.length > this.maxFiles) {
      const oldest = files.shift()!;
      const oldestPath = join(this.logDir, oldest);
      unlinkSync(oldestPath);
      logger.info(`Deleted old log archive: ${oldest}`);
    }
  }

  private getFileSize(filePath: string): number {
    try {
      const stat = Bun.file(filePath).size;
      return stat;
    } catch {
      return 0;
    }
  }
}

let fileLoggerInstance: FileLogger | undefined;

function initFileLogger(options: FileLoggerOptions): void {
  fileLoggerInstance = new FileLogger(options);
}

function writeToFile(level: string, message: string): void {
  if (fileLoggerInstance !== undefined) {
    fileLoggerInstance.write(level, message);
  }
}

export type { FileLoggerOptions };
export { initFileLogger, writeToFile };
