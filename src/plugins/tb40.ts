import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb40",
  category: "general",
  description: "Test 40: Order Button Fixed Amount",
  usage: ".tb40",
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
                text: "Klik tombol di bawah. Saya menggunakan harga Rp 1 agar tombol muncul di HP Anda.",
              },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "order_details",
                    buttonParamsJson: JSON.stringify({
                      id: ".menu", // Command yang akan dijalankan
                      total_amount: 1000, // Rp 1.00 (format 1000 = 1 unit mata uang)
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
