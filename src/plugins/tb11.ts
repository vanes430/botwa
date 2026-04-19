import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb11",
  category: "general",
  description: "Test 11: Carousel HSCROLL (Beta Fix)",
  usage: ".tb11",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const card = {
      header: { title: "Pilih Opsi", hasMediaAttachment: false },
      body: { text: "Konten kartu interaktif." },
      nativeFlowMessage: {
        buttons: [
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({ display_text: "Ping", id: ".ping" }),
          },
        ],
        messageVersion: 1,
      },
    };

    const messageContent = proto.Message.fromObject({
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text: "🤖 *Carousel Test 11*" },
            carouselMessage: {
              cards: [card],
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
