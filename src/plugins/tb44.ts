import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb44",
  category: "general",
  description: "Test 44: Hybrid NativeFlow (URL + Reply)",
  usage: ".tb44",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const messageContent = proto.Message.fromObject({
      viewOnceMessageV2: {
        message: {
          interactiveMessage: {
            header: { title: "🤖 *Hybrid UI*", hasMediaAttachment: false },
            body: { text: "Menggunakan campuran tombol Link dan Quick Reply." },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "cta_url",
                  buttonParamsJson: JSON.stringify({
                    display_text: "Visit Support",
                    url: "https://github.com",
                    merchant_url: "https://github.com",
                  }),
                },
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({ display_text: "Ping Bot", id: ".ping" }),
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
