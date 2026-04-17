import type { BaileysEventMap, WASocket } from "baileys";
import { functions, presenceManager, userService } from "../library/index.js";

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
      if (functions.isOwner(callerJid)) continue;

      try {
        await sock.rejectCall(call.id, callerJid);
        const warnings = await userService.addWarning(callerJid);
        const maxWarnings = 3;

        if (warnings >= maxWarnings) {
          await sock.sendMessage(callerJid, {
            text: `📵 You have been blocked for calling ${warnings} times.`,
          });
          await sock.updateBlockStatus(callerJid, "block");
        } else {
          await sock.sendMessage(callerJid, {
            text: `📵 Calls not accepted. Warning ${warnings}/${maxWarnings}.`,
          });
        }
      } catch (error) {
        logger.error(`[Anti-Call] Error: ${String(error)}`);
      }
    }
  });
}
