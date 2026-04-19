import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb42",
  category: "general",
  description: "Test 42: Order Status Update",
  usage: ".tb42",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const msg = generateWAMessageFromContent(
      m.from,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              header: { title: "📦 *Order Processed*", hasMediaAttachment: false },
              body: { text: "Klik detail pesanan yang telah diproses." },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "order_status",
                    buttonParamsJson: JSON.stringify({
                      id: ".stats",
                      status: "SHIPPED",
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
