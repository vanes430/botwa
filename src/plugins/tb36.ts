import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb36",
  category: "general",
  description: "Test 36: Order Details NativeFlow",
  usage: ".tb36",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const msg = generateWAMessageFromContent(
      m.from,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              header: { title: "📦 *Order Detail Mode*", hasMediaAttachment: false },
              body: {
                text: "Mengetes apakah UI detail pesanan (Order) dapat memicu tombol di HP Anda.",
              },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "order_details",
                    buttonParamsJson: JSON.stringify({
                      id: "order-123",
                      total_amount: 1000,
                      currency: "IDR",
                    }),
                  },
                ],
                messageVersion: 1,
              },
            },
          },
        },
      },
      { userJid: sock.user?.id, quoted: m }
    );

    await sock.relayMessage(m.from, msg.message!, { messageId: msg.key.id! });
  }
}
