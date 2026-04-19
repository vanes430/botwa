import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb31",
  category: "general",
  description: "Test 31: NativeFlow + Base64 Thumbnail",
  usage: ".tb31",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const messageContent = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "🤖 *Base64 Proxy*",
              hasMediaAttachment: true,
              imageMessage: {
                // Dummy tiny pixel image to trigger render
                jpegThumbnail: Buffer.from(
                  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
                  "base64"
                ),
              },
            },
            body: { text: "Menggunakan thumbnail base64 untuk memancing UI tombol di HP." },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({ display_text: "Ping", id: ".ping" }),
                },
              ],
              messageVersion: 1,
            },
          },
        },
      },
    };

    const msg = generateWAMessageFromContent(m.from, messageContent, {
      userJid: sock.user?.id,
      quoted: m,
    });
    await sock.relayMessage(m.from, msg.message!, { messageId: msg.key.id! });
  }
}
