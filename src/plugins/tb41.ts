import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb41",
  category: "general",
  description: "Test 41: Payment Status Button",
  usage: ".tb41",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const msg = generateWAMessageFromContent(
      m.from,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              header: { title: "✅ *Payment Successful*", hasMediaAttachment: false },
              body: { text: "Klik rincian pembayaran di bawah untuk memicu command." },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "payment_status_details",
                    buttonParamsJson: JSON.stringify({
                      id: ".ping",
                      total_amount: { value: 100, offset: 100 },
                      currency: "IDR",
                      status: "success",
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
