import type { WASocket } from "baileys";
import { generateWAMessageFromContent } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb2",
  category: "general",
  description: "Test 2: ViewOnce ButtonsMessage",
  usage: ".tb2",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const messageContent = {
      viewOnceMessage: {
        message: {
          buttonsMessage: {
            contentText:
              "🤖 *Test 2: ButtonsMessage*\n\nIni adalah format tombol MD generasi pertama.",
            footerText: "Botwa MD",
            buttons: [
              { buttonId: ".ping", buttonText: { displayText: "Tombol 1" }, type: 1 },
              { buttonId: ".menu", buttonText: { displayText: "Tombol 2" }, type: 1 },
            ],
            headerType: 1,
            contextInfo: {
              externalAdReply: {
                title: "Botwa Test 2",
                body: "ViewOnce MD Buttons",
                mediaType: 1,
                sourceUrl: "https://google.com",
              },
            },
          },
        },
      },
    };

    const msg = generateWAMessageFromContent(m.from, messageContent, {
      userJid: sock.user?.id,
      quoted: m,
    });
    await sock.relayMessage(m.from, msg.message!, { messageId: msg.key.id! });
  }
}
