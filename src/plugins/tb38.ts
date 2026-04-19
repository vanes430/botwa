import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb38",
  category: "general",
  description: "Test 38: Hybrid Order + Quick Reply",
  usage: ".tb38",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const msg = generateWAMessageFromContent(
      m.from,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              header: { title: "🤖 *Hybrid UI*", hasMediaAttachment: false },
              body: {
                text: "Mengetes apakah adanya tombol Order dapat 'memancing' tombol Quick Reply agar ikut muncul.",
              },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "order_details",
                    buttonParamsJson: JSON.stringify({
                      id: "order-1",
                      total_amount: 0,
                      currency: "IDR",
                    }),
                  },
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({ display_text: "Ping ⏱️", id: ".ping" }),
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
