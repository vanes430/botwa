import type { BaileysEventMap, WASocket } from "baileys";
import { printMessageLog } from "../core/connection-logic.js";
import { functions } from "../library/index.js";
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

    // Human-like auto-read
    if (message.key.id !== undefined && config.autoRead === true) {
      await functions.sleep(functions.getRandomDelay(2000, 4000));
      await sock.readMessages([message.key]);
    }

    if (message.message === undefined || resolved.type !== "notify") return;

    const body = functions.extractMessageText(message.message);
    if (body !== "") {
      await printMessageLog(sock, message, functions, getGroupName);
    }

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
