import type { WASocket } from "baileys";
import { prepareWAMessageMedia } from "baileys";

export interface StickerMetadata {
  packName?: string;
  author?: string;
  description?: string;
  emojis?: string[];
}

/**
 * Mengirim stiker (WebP atau Lottie/WAS)
 */
export async function sendSticker(
  sock: WASocket,
  jid: string,
  buffer: Buffer,
  isLottie = false,
  quoted?: proto.IWebMessageInfo
): Promise<void> {
  const media = await prepareWAMessageMedia(
    { sticker: buffer },
    {
      upload: (
        sock as unknown as {
          waUploadToServer: (
            content: Buffer,
            opts: { mimetype: string; file?: string }
          ) => Promise<string>;
        }
      ).waUploadToServer,
    }
  );

  if (media.stickerMessage) {
    if (isLottie) {
      media.stickerMessage.mimetype = "application/was";
      media.stickerMessage.isLottie = true;
      media.stickerMessage.isAnimated = true;
    }

    await sock.relayMessage(jid, media, { quoted });
  }
}

/**
 * Helper untuk membuat metadata .was
 */
export function createWasMetadata(meta: StickerMetadata): string {
  const data = {
    "sticker-pack-id": `custom-pack-${Date.now()}`,
    "sticker-pack-name": meta.packName || "Custom Pack",
    "sticker-pack-publisher": meta.author || "BotWA",
    "accessibility-text": meta.description || "Stiker Animasi",
    emojis: meta.emojis || ["✨"],
    "is-from-user-created-pack": 1,
  };
  return JSON.stringify(data);
}
