import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb39",
  category: "general",
  description: "Test 39: Review and Pay Mode",
  usage: ".tb39",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const msg = generateWAMessageFromContent(
      m.from,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              header: { title: "💳 *Transaction Mode*", hasMediaAttachment: false },
              body: {
                text: "Mengetes tipe tombol 'review_and_pay' yang juga merupakan tombol transaksi.",
              },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "review_and_pay",
                    buttonParamsJson: JSON.stringify({
                      id: ".ping",
                      total_amount: { value: 0, offset: 100 },
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
