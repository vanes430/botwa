import type { MessageData } from "../types/index.js";
import { logger } from "./logger.js";

/**
 * Task yang masuk ke dalam antrian global bot.
 */
export interface CommandTask {
  sock: WASocket;
  data: MessageData;
  commandName: string;
  execute: () => Promise<void>;
}

/**
 * GlobalQueue: Sistem antrian perintah global bot (FIFO).
 * Menjamin bot hanya mengeksekusi satu perintah dalam satu waktu agar lebih humanized.
 * Pengembang dapat mengakses ini secara global via `globalQueue`.
 */
class GlobalQueue {
  private queue: CommandTask[] = [];
  private isProcessing = false;

  /**
   * Menambahkan tugas baru ke dalam antrian
   */
  public enqueue(task: CommandTask): void {
    this.queue.push(task);
    logger.info(
      `[Queue] Command added: ${task.commandName} from ${task.data.sender} [${this.queue.length} in queue]`
    );

    if (!this.isProcessing) {
      this.processNext().catch((error) => {
        logger.error("[Queue] Fatal error in worker", { error: String(error) });
      });
    }
  }

  /**
   * Memproses tugas berikutnya dalam antrian secara FIFO
   */
  private async processNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const task = this.queue.shift();

    if (task !== undefined) {
      try {
        logger.info(
          `[Worker] Executing: ${task.commandName} from ${task.data.sender} [Remaining: ${this.queue.length}]`
        );
        await task.execute();
      } catch (error: unknown) {
        logger.error(`[Worker] Error executing ${task.commandName}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Lanjut ke tugas berikutnya
    await this.processNext();
  }

  /**
   * Mendapatkan ukuran antrian saat ini
   */
  public get size(): number {
    return this.queue.length;
  }
}

export const globalQueue = new GlobalQueue();
