import type { BaileysEventMap } from "baileys";
import { presenceManager } from "../library/index.js";

/**
 * Menangani panggilan masuk (Anti-Call)
 */
export function setupCallHandler(sock: WASocket): void {
  sock.ev.on("call", async (calls: BaileysEventMap["call"]): Promise<void> => {
    // Trigger Smart Presence: Bot becomes online for 5 minutes
    if (config.alwaysOnline === false) {
      void presenceManager.update(sock);
    }

    if (config.antiCall !== true) return;
    for (const call of calls) {
      if (call.status !== "offer") continue;

      const callerJid = call.from ?? "";

      try {
        await sock.rejectCall(call.id, callerJid);
        logger.info(`[Anti-Call] Blocked call from ${callerJid}`);
      } catch (error) {
        logger.error(`[Anti-Call] Error rejecting call: ${String(error)}`);
      }
    }
  });
}
