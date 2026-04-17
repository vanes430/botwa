import type { WASocket } from "baileys";
import { logger } from "./logger.js";

/**
 * PresenceManager: Mengatur status online bot secara cerdas.
 * Bot akan terlihat online selama 5 menit setiap kali ada interaksi,
 * dan akan otomatis offline jika tidak ada aktivitas.
 */
class PresenceManager {
  private timer: NodeJS.Timeout | null = null;
  private isOnline = false;
  private readonly ON_DURATION = 5 * 60 * 1000; // 5 menit dalam milidetik

  /**
   * Memperbarui status online bot dan mereset timer.
   */
  public async update(sock: WASocket): Promise<void> {
    // Bersihkan timer lama jika ada
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Jika bot sedang offline, buat jadi online
    if (!this.isOnline) {
      try {
        await sock.sendPresenceUpdate("available");
        this.isOnline = true;
        logger.debug("[Presence] Bot is now ONLINE (available)");
      } catch (error) {
        logger.error("[Presence] Failed to update presence to available", { error: String(error) });
      }
    }

    // Set timer untuk mematikan status online setelah 5 menit
    this.timer = setTimeout(async () => {
      try {
        await sock.sendPresenceUpdate("unavailable");
        this.isOnline = false;
        this.timer = null;
        logger.debug("[Presence] Bot is now OFFLINE (unavailable) due to inactivity");
      } catch (error) {
        logger.error("[Presence] Failed to update presence to unavailable", {
          error: String(error),
        });
      }
    }, this.ON_DURATION);
  }

  /**
   * Paksa bot offline (misal saat logout/disconnect)
   */
  public reset(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isOnline = false;
  }
}

export const presenceManager = new PresenceManager();
