import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb10",
  category: "general",
  description: "Test 10: Interactive with Ad-Reply Context",
  usage: ".tb10",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    // Terkadang tombol hanya muncul jika contextInfo memiliki externalAdReply lengkap
    const messageContent = proto.Message.fromObject({
      viewOnceMessageV2: {
        message: {
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({
              text: "🤖 *Test 10*\n\nMenggunakan External Ad-Reply sebagai pemicu render.",
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({ display_text: "Click Me", id: ".ping" }),
                },
              ],
              messageVersion: 1,
            }),
            contextInfo: {
              mentionedJid: [m.sender],
              externalAdReply: {
                title: "Ad-Reply Trigger",
                body: "Interactive System",
                mediaType: 1,
                renderLargerThumbnail: true,
                thumbnailUrl:
                  "https://raw.githubusercontent.com/naruyaizumi/baileys/master/docs/logo.png",
                sourceUrl: "https://github.com",
              },
            },
          }),
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
