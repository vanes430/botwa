import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { downloadContentFromMessage } from "baileys";
import { Command } from "../library/decorators.js";
import type { MessageData } from "../types/index.js";
import { BaseCommand } from "../types/index.js";

@Command({
  name: "savesr",
  category: "sticker",
  description: "Save a sticker to the server folder /sticker",
  usage: "Reply to a sticker with .savesr",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const quoted = m.quoted?.message;

    if (!quoted) {
      await sock.sendMessage(m.from, {
        text: "mohon reply ke stiker atau file .was yang ingin di save",
      });
      return;
    }

    // Recursive search for media in the message object
    const findMedia = (
      msg: proto.IMessage | null | undefined
    ): {
      message: proto.IStickerMessage | proto.IDocumentMessage;
      type: "sticker" | "document";
    } | null => {
      if (!msg) return null;

      // Direct types
      if (msg.stickerMessage) return { message: msg.stickerMessage, type: "sticker" };
      if (msg.documentMessage) return { message: msg.documentMessage, type: "document" };

      // New format: lottieStickerMessage
      if (msg.lottieStickerMessage?.message?.stickerMessage) {
        return { message: msg.lottieStickerMessage.message.stickerMessage, type: "sticker" };
      }

      // Nested types (ephemeral, viewOnce)
      if (msg.ephemeralMessage?.message) return findMedia(msg.ephemeralMessage.message);
      if (msg.viewOnceMessage?.message) return findMedia(msg.viewOnceMessage.message);
      if (msg.viewOnceMessageV2?.message) return findMedia(msg.viewOnceMessageV2.message);
      if (msg.documentWithCaptionMessage?.message?.documentMessage) {
        return {
          message: msg.documentWithCaptionMessage.message.documentMessage,
          type: "document",
        };
      }

      return null;
    };

    const media = findMedia(quoted);

    if (!media) {
      await sock.sendMessage(m.from, {
        text: "mohon reply ke stiker atau file .was yang ingin di save",
      });
      return;
    }

    try {
      // Show reaction while processing
      await sock.sendMessage(m.from, { react: { text: "⏳", key: m.key } });

      const mediaMessage = media.message;
      const mediaType = media.type;

      // Download the content
      const stream = await downloadContentFromMessage(mediaMessage, mediaType);

      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // Ensure /sticker directory exists
      const stickerDir = path.join(process.cwd(), "sticker");
      await mkdir(stickerDir, { recursive: true });

      // Determine extension
      const isWas =
        mediaMessage.mimetype === "application/was" ||
        mediaMessage.fileName?.endsWith(".was") ||
        mediaMessage.isLottie;
      const isAnimated = mediaMessage.isAnimated || isWas;

      const ext = isWas ? "was" : isAnimated ? "webp" : "webp";
      const typeStr = isWas ? "Lottie (.was)" : isAnimated ? "Animated (.webp)" : "Static (.webp)";

      const fileName = `sticker_${Date.now()}.${ext}`;
      const filePath = path.join(stickerDir, fileName);

      // Save the buffer to file
      await writeFile(filePath, buffer);

      // Send success message
      await sock.sendMessage(m.from, {
        text: `Berhasil menyimpan stiker ${typeStr} ke /sticker/${fileName}`,
      });

      // Clear reaction
      await sock.sendMessage(m.from, { react: { text: "✅", key: m.key } });
    } catch (error) {
      logger.error("[SaveSticker] Error saving sticker", { error: String(error) });
      await sock.sendMessage(m.from, {
        text: "Gagal menyimpan stiker. Terjadi kesalahan teknis.",
      });
    }
  }
}
