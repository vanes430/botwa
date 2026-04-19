import sharp from "sharp";
import { Command } from "../library/decorators.js";
import { logger } from "../library/logger.js";
import type { MessageData } from "../types/index.js";
import { BaseCommand } from "../types/index.js";

@Command({
  name: "brat",
  category: "tools",
  description: "Generate a 1:1 brat-style sticker",
  usage: ".brat <text>",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData, args: string[]): Promise<void> {
    const text = args.join(" ");

    if (!text) {
      await sock.sendMessage(m.from, {
        text: "Please provide text for the brat sticker!\nUsage: .brat hello",
      });
      return;
    }

    try {
      // Show reaction while processing
      await sock.sendMessage(m.from, { react: { text: "⏳", key: m.key } });

      const apiUrl = `https://fourmovie-brat.hf.space/?text=${encodeURIComponent(text)}`;
      const response = await http.fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const inputBuffer = Buffer.from(await response.arrayBuffer());

      // Use sharp for 1:1 cropping and WebP conversion
      const stickerBuffer = await sharp(inputBuffer)
        .resize(512, 512, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background for brat style
        })
        .webp()
        .toBuffer();

      // Send as sticker
      await sock.sendMessage(m.from, {
        sticker: stickerBuffer,
      });

      // Clear reaction
      await sock.sendMessage(m.from, { react: { text: "✅", key: m.key } });
    } catch (error) {
      logger.error("[Brat] Error generating sticker", { error: String(error) });
      await sock.sendMessage(m.from, {
        text: "Failed to generate brat sticker. Please try again later.",
      });
    }
  }
}
