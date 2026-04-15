import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { logger } from "./logger.js";
import { sessionManager } from "./session-manager.js";

/**
 * GarbageCollector untuk pembersihan berkala sistem bot.
 */
class GarbageCollector {
  private intervalId?: NodeJS.Timeout;
  private readonly CLEANUP_INTERVAL = 3_600_000; // 1 jam sekali

  /**
   * Menjalankan siklus pembersihan pertama dan menjadwalkan siklus berikutnya.
   */
  public start(): void {
    logger.info("[GC] Garbage Collector started.");
    this.runCleanup();
    this.intervalId = setInterval(() => this.runCleanup(), this.CLEANUP_INTERVAL);
  }

  /**
   * Menghentikan penjadwal.
   */
  public stop(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
    }
  }

  /**
   * Menjalankan semua tugas pembersihan.
   */
  private runCleanup(): void {
    try {
      this.cleanTmpFolder();
      this.cleanOldLogs();
      sessionManager.cleanup();
    } catch (error: unknown) {
      logger.error("[GC] Error during cleanup cycle", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Menghapus semua file di folder tmp (temporary media).
   */
  private cleanTmpFolder(): void {
    const tmpDir = "./tmp";
    if (!existsSync(tmpDir)) return;

    const files = readdirSync(tmpDir);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = join(tmpDir, file);
      // Hanya hapus file yang berumur lebih dari 30 menit
      const stats = statSync(filePath);
      const ageInMs = Date.now() - stats.mtimeMs;

      if (ageInMs > 1_800_000) {
        rmSync(filePath, { force: true });
        deletedCount += 1;
      }
    }

    if (deletedCount > 0) {
      logger.info(`[GC] Cleaned up ${deletedCount} files from ./tmp`);
    }
  }

  /**
   * Membersihkan log yang berumur lebih dari 7 hari.
   */
  private cleanOldLogs(): void {
    const logsDir = "./logs";
    if (!existsSync(logsDir)) return;

    const files = readdirSync(logsDir).filter((f) => f.endsWith(".tar.gz"));
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 hari

    for (const file of files) {
      const filePath = join(logsDir, file);
      const stats = statSync(filePath);
      if (Date.now() - stats.mtimeMs > maxAgeMs) {
        rmSync(filePath);
        logger.info(`[GC] Deleted old log archive: ${file}`);
      }
    }
  }
}

export const garbageCollector = new GarbageCollector();
