import type { BaileysEventMap, WASocket } from "baileys";
import { config } from "../config/config.js";
import { printMessageLog } from "../core/connection-logic.js";
import { functions, presenceManager } from "../library/index.js";
import { handleMessage, transformMessagesUpsert } from "../modules/index.js";

/**
 * Menangani event messages.upsert dari Baileys
 */
export async function setupMessageUpsert(
  sock: WASocket,
  getGroupName: (sock: WASocket, jid: string) => Promise<string>
): Promise<void> {
  sock.ev.on("messages.upsert", async (m: BaileysEventMap["messages.upsert"]): Promise<void> => {
    const resolved = transformMessagesUpsert(m);
    const message = resolved.messages[0];

    if (message === undefined) return;

    // Trigger Smart Presence: Bot becomes online for 5 minutes
    if (config.alwaysOnline === false) {
      void presenceManager.update(sock);
    }

    const body = functions.extractMessageText(message.message);
    if (body !== "" && message.message !== undefined && resolved.type === "notify") {
      await printMessageLog(sock, message, functions, getGroupName);
    }

    // Human-like auto-read in background
    if (message.key.id !== undefined && config.autoRead === true) {
      void (async () => {
        await functions.sleep(functions.getRandomDelay(4000, 6000));
        await sock.readMessages([message.key]);
      })();
    }

    if (message.message === undefined || resolved.type !== "notify") return;

    const from = message.key.remoteJid ?? "";
    const sender = message.key.participant || from;
    const isGroup = functions.isGroup(from);

    const messageData: MessageData = {
      key: message.key,
      message: message.message,
      body,
      from,
      sender,
      isGroup,
      timestamp: message.messageTimestamp as number,
      pushName: message.pushName ?? "",
      quoted: functions.getQuotedMessage(message.message),
    };

    // Extract media info
    const msg = message.message;
    if (msg.imageMessage) {
      messageData.media = {
        type: "image",
        mimetype: msg.imageMessage.mimetype ?? "image/jpeg",
        caption: msg.imageMessage.caption ?? undefined,
      };
    } else if (msg.videoMessage) {
      messageData.media = {
        type: "video",
        mimetype: msg.videoMessage.mimetype ?? "video/mp4",
        caption: msg.videoMessage.caption ?? undefined,
      };
    } else if (msg.audioMessage) {
      messageData.media = { type: "audio", mimetype: msg.audioMessage.mimetype ?? "audio/ogg" };
    } else if (msg.stickerMessage) {
      messageData.media = {
        type: "sticker",
        mimetype: msg.stickerMessage.mimetype ?? "image/webp",
      };
    } else if (msg.documentMessage) {
      messageData.media = {
        type: "document",
        mimetype: msg.documentMessage.mimetype ?? "application/octet-stream",
      };
    }

    await handleMessage(sock, messageData);
  });
}
