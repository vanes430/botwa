import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb15",
  category: "general",
  description: "Test 15: Carousel Album Image Mode",
  usage: ".tb15",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const card = {
      body: { text: "Contoh Kartu Album" },
      nativeFlowMessage: {
        buttons: [
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({ display_text: "Klik", id: ".ping" }),
          },
        ],
        messageVersion: 1,
      },
    };

    const messageContent = proto.Message.fromObject({
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text: "🤖 *Carousel Test 15 (Album Mode)*" },
            carouselMessage: {
              cards: [card, card], // Minimal 2 kartu untuk Album
              messageVersion: 1,
              carouselCardType: 2, // ALBUM_IMAGE
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
