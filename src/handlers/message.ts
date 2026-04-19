import type { BaileysEventMap, proto, WASocket } from "baileys";
import { config } from "../config/config.js";
import { printMessageLog } from "../core/connection-logic.js";
import { functions, presenceManager } from "../library/index.js";
import { handleMessage, transformMessagesUpsert } from "../modules/index.js";
import { pollStore } from "./poll.js";

/**
 * Menangani event messages.upsert dari Baileys
 */
export async function setupMessageUpsert(
  sock: WASocket,
  getGroupName: (sock: WASocket, jid: string) => Promise<string>
): Promise<void> {
  sock.ev.on("messages.upsert", async (m: BaileysEventMap["messages.upsert"]): Promise<void> => {
    const resolved = transformMessagesUpsert(m);
    const currentTime = Math.floor(Date.now() / 1000);

    // Trigger Smart Presence once per batch
    if (config.alwaysOnline === false && resolved.messages.length > 0) {
      void presenceManager.update(sock);
    }

    // Koleksi pesan terakhir untuk setiap JID agar bisa di-mark as read sekaligus
    const readTargets = new Map<
      string,
      { message: proto.IWebMessageInfo; originalMessage: proto.IWebMessageInfo }
    >();

    for (let i = 0; i < resolved.messages.length; i++) {
      const message = resolved.messages[i];
      const originalMessage = m.messages[i]; // Keep original for auto-read
      if (message === undefined || originalMessage === undefined) continue;

      const from = message.key.remoteJid ?? "";
      const isGroup = functions.isGroup(from);
      const sender = isGroup ? (message.key.participant ?? from) : from;

      const timestamp = Number(message.messageTimestamp || 0);
      const isOldMessage = timestamp < currentTime - 10;

      // Simpan pesan terbaru untuk JID ini untuk ditandai sudah dibaca nanti
      if (config.autoRead === true && !message.key.fromMe) {
        readTargets.set(from, { message, originalMessage });
      }

      const body = functions.extractMessageText(message.message);

      // LOG hanya untuk pesan baru
      if (
        body !== "" &&
        message.message !== undefined &&
        resolved.type === "notify" &&
        !isOldMessage
      ) {
        await printMessageLog(sock, message, functions, getGroupName);
      }

      // Jika pesan lama atau bukan tipe notify, jangan lanjut ke fitur/command
      if (message.message === undefined || resolved.type !== "notify" || isOldMessage) continue;

      const pollCreation =
        message.message.pollCreationMessage ||
        message.message.pollCreationMessageV2 ||
        message.message.pollCreationMessageV3 ||
        message.message.pollCreationMessageV4;

      if (pollCreation && message.key.id) {
        const messageSecret = message.messageContextInfo?.messageSecret;
        if (messageSecret) {
          pollStore.set(message.key.id, {
            encKey: messageSecret,
            name: pollCreation.name || "",
            options: pollCreation.options?.map((o) => o.optionName || "") || [],
            creatorJid: message.key.fromMe
              ? `${sock.user?.id?.split(":")[0] || ""}@s.whatsapp.net`
              : message.key.participant || message.key.remoteJid!,
          });
        }
      }

      const messageData: MessageData = {
        key: message.key,
        originalKey: originalMessage.key,
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
    }

    // Eksekusi Mark as Read untuk setiap JID (Satu kali per percakapan)
    for (const [jid, target] of readTargets) {
      const { message, originalMessage } = target;
      const timestamp = Number(message.messageTimestamp || 0);
      const isOldMessage = timestamp < currentTime - 10;
      const isGroup = functions.isGroup(jid);

      void (async () => {
        const readDelay = isOldMessage ? 300 : functions.getRandomDelay(2000, 4000);
        await functions.sleep(readDelay);
        await functions.markAsRead(
          sock,
          jid,
          message.key.participant || undefined,
          message.key.id!,
          timestamp,
          isGroup,
          originalMessage.key
        );
      })();
    }
  });
}
