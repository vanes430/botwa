import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb18",
  category: "general",
  description: "Test 18: V2 + NativeFlow + Image Header",
  usage: ".tb18",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const messageContent = proto.Message.fromObject({
      viewOnceMessageV2: {
        message: {
          interactiveMessage: {
            header: {
              title: "🤖 *Botwa Media*",
              hasMediaAttachment: true,
              imageMessage: {
                url: "https://raw.githubusercontent.com/naruyaizumi/baileys/master/docs/logo.png",
                mimetype: "image/png",
              },
            },
            body: { text: "Tombol dengan Image Header di dalam ViewOnceV2." },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({ display_text: "Klik Tombol", id: ".ping" }),
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
