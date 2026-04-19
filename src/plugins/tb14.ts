import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb14",
  category: "general",
  description: "Test 14: Carousel High Compatibility",
  usage: ".tb14",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const createCard = (title: string, btnText: string, id: string) => ({
      header: { title, hasMediaAttachment: false },
      body: { text: "Pilih aksi untuk kartu ini." },
      footer: { text: "Botwa MD" },
      nativeFlowMessage: {
        buttons: [
          { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: btnText, id }) },
        ],
        messageVersion: 1,
      },
      // Beberapa versi MD butuh templateId di tiap kartu
      messageParamsJson: JSON.stringify({ templateId: `card-${Math.random()}` }),
    });

    const messageContent = proto.Message.fromObject({
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text: "🤖 *Carousel Test 14*\nKlik tombol di bawah kartu:" },
            carouselMessage: {
              cards: [createCard("Opsi 1", "Ping", ".ping"), createCard("Opsi 2", "Menu", ".menu")],
              messageVersion: 1,
              carouselCardType: 1, // HSCROLL_CARDS
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
