import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb5",
  category: "general",
  description: "Test 5: Interactive CarouselMessage",
  usage: ".tb5",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    // Carousel adalah format terbaru WhatsApp MD. Kadang filter WhatsApp terlewat
    // jika pesan dikirim dalam format kartu geser (carousel).

    const card = proto.Message.InteractiveMessage.create({
      body: proto.Message.InteractiveMessage.Body.create({ text: "Kartu 1" }),
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
        buttons: [
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({ display_text: "Klik Saya", id: ".ping" }),
          },
        ],
      }),
    });

    const msg = generateWAMessageFromContent(
      m.from,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({
                text: "🤖 *Test 5: CarouselMessage*\n\nGeser kartu di bawah ini.",
              }),
              carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({
                cards: [card],
                messageVersion: 1,
              }),
            }),
          },
        },
      },
      { userJid: sock.user?.id, quoted: m }
    );

    await sock.relayMessage(m.from, msg.message!, { messageId: msg.key.id! });
  }
}
