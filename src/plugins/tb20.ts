import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb20",
  category: "general",
  description: "Test 20: NativeFlow with Document Header",
  usage: ".tb20",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const messageContent = proto.Message.fromObject({
      viewOnceMessageV2: {
        message: {
          interactiveMessage: {
            header: {
              title: "🤖 *Document Header*",
              hasMediaAttachment: true,
              documentMessage: {
                url: "https://raw.githubusercontent.com/naruyaizumi/baileys/master/docs/logo.png",
                mimetype: "application/pdf", // Fake PDF trick
                fileName: "Botwa-MD.pdf",
              },
            },
            body: { text: "Tombol ini muncul di bawah 'file PDF' palsu." },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({ display_text: "Ping", id: ".ping" }),
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
