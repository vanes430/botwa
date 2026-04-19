import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb37",
  category: "general",
  description: "Test 37: Order Button as Command",
  usage: ".tb37",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const msg = generateWAMessageFromContent(
      m.from,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              header: { title: "🤖 *Botwa Order System*", hasMediaAttachment: false },
              body: {
                text: "Klik 'Review Order' di bawah. Saya telah menyisipkan command `.menu` di dalamnya.",
              },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "order_details",
                    buttonParamsJson: JSON.stringify({
                      id: ".menu", // Kita coba masukkan command ke sini
                      total_amount: 0,
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
