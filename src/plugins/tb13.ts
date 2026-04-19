import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb13",
  category: "general",
  description: "Test 13: Image-Header Buttons (The Trigger)",
  usage: ".tb13",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    // Terkadang client hanya merender tombol jika ada Media (Image) di headernya
    const messageContent = proto.Message.fromObject({
      viewOnceMessage: {
        message: {
          buttonsMessage: {
            imageMessage: {
              url: "https://raw.githubusercontent.com/naruyaizumi/baileys/master/docs/logo.png",
              mimetype: "image/png",
              caption: "Contoh Image Header",
            },
            contentText:
              "🤖 *Test 13: Image-Header*\n\nTombol ini menggunakan gambar untuk memicu render.",
            footerText: "© Botwa MD",
            buttons: [{ buttonId: ".ping", buttonText: { displayText: "Opsi 1" }, type: 1 }],
            headerType: 4, // IMAGE
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
