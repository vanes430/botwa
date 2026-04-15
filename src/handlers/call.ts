import type { BaileysEventMap, WASocket } from "baileys";
import { functions, userService } from "../library/index.js";

/**
 * Menangani panggilan masuk (Anti-Call)
 */
export function setupCallHandler(sock: WASocket): void {
  if (config.antiCall !== true) return;

  sock.ev.on("call", async (calls: BaileysEventMap["call"]): Promise<void> => {
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
