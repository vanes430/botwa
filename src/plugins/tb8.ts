import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb8",
  category: "general",
  description: "Test 8: Optimized V2 Carousel (Fixed Update Error)",
  usage: ".tb8",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const card = proto.Message.InteractiveMessage.create({
      header: proto.Message.InteractiveMessage.Header.create({
        title: "Card Header",
        hasMediaAttachment: false,
      }),
      body: proto.Message.InteractiveMessage.Body.create({ text: "Konten kartu dengan tombol." }),
      footer: proto.Message.InteractiveMessage.Footer.create({ text: "Footer Kartu" }),
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
        buttons: [
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({ display_text: "Opsi 1", id: ".ping" }),
          },
        ],
      }),
    });

    const messageContent = proto.Message.fromObject({
      viewOnceMessageV2: {
        message: {
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({
              text: "🤖 *Test 8: V2 Carousel*\n\nOptimasi agar tidak muncul pesan update.",
            }),
            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({
              cards: [card],
              messageVersion: 1,
            }),
          }),
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
