import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb23",
  category: "general",
  description: "Test 23: ViewOnce V1 + NativeFlow + List",
  usage: ".tb23",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const messageContent = proto.Message.fromObject({
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text: "🤖 *List Mode MD*\nKlik tombol di bawah untuk melihat pilihan menu." },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "single_select",
                  buttonParamsJson: JSON.stringify({
                    title: "Pilih Command",
                    sections: [
                      {
                        title: "Utama",
                        rows: [
                          { title: "Ping", id: ".ping" },
                          { title: "Menu", id: ".menu" },
                        ],
                      },
                    ],
                  }),
                },
              ],
              messageVersion: 1,
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
