import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb33",
  category: "general",
  description: "Test 33: Product Message Proxy",
  usage: ".tb33",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const messageContent = {
      viewOnceMessage: {
        message: {
          productMessage: {
            product: {
              productId: "bot-system-" + Date.now(),
              title: "🤖 *Botwa System*",
              description: "Interactive Menu Proxy",
              currencyCode: "IDR",
              priceAmount1000: 0,
              productImageCount: 0,
            },
            businessOwnerJid: sock.user?.id,
            contextInfo: {
              externalAdReply: {
                title: "Menu Aktif",
                body: "Klik di sini",
                mediaType: 1,
              },
            },
          },
        },
      },
    };

    // Ini bukan tombol murni, tapi Product Card seringkali 'lolos'
    // dan bisa diklik oleh user untuk memicu interaksi.
    const msg = generateWAMessageFromContent(m.from, messageContent, {
      userJid: sock.user?.id,
      quoted: m,
    });
    await sock.relayMessage(m.from, msg.message!, { messageId: msg.key.id! });
  }
}
