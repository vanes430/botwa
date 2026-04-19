import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb45",
  category: "general",
  description: "Test 45: Shop Storefront Interactive",
  usage: ".tb45",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const messageContent = proto.Message.fromObject({
      viewOnceMessage: {
        // V1 often works better with Shop
        message: {
          interactiveMessage: {
            header: { title: "🛍️ *Botwa Catalog*", hasMediaAttachment: false },
            body: { text: "Meniru struktur pesan Katalog Bisnis agar tombol dirender oleh HP." },
            shopStorefrontMessage: {
              id: "catalog-1",
              surface: 3, // WA
              messageVersion: 1,
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({ display_text: "Menu Utama", id: ".menu" }),
                },
              ],
              messageVersion: 1,
            },
          },
        },
      },
    });

    const msg = generateWAMessageFromContent(m.from, messageContent, {
      userJid: sock.user?.id,
      quoted: m,
    });
    await sock.relayMessage(m.from, msg.message!, { messageId: msg.key.id! });
  }
}
