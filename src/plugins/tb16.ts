import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb16",
  category: "general",
  description: "Test 16: ViewOnceV2 + NativeFlow (No Carousel)",
  usage: ".tb16",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const messageContent = proto.Message.fromObject({
      viewOnceMessageV2: {
        message: {
          interactiveMessage: {
            header: { title: "🤖 *Botwa V2 MD*", hasMediaAttachment: false },
            body: {
              text: "Menggunakan wrapper ViewOnceV2 untuk menghindari bug 'Update WhatsApp'.",
            },
            footer: { text: "© Botwa MD" },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({ display_text: "Ping", id: ".ping" }),
                },
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({ display_text: "Menu", id: ".menu" }),
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
