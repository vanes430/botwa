import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb32",
  category: "general",
  description: "Test 32: Shop/Collection Interactive Header",
  usage: ".tb32",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const messageContent = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: { title: "🛍️ *Shop Menu*", hasMediaAttachment: false },
            body: { text: "Menggunakan Shop Storefront context untuk menembus filter HP." },
            shopStorefrontMessage: {
              id: "bot-menu",
              surface: 3, // WA
              messageVersion: 1,
            },
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
