import type { WASocket } from "baileys";
import { generateWAMessageFromContent } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "testbutton",
  alias: ["tb", "tombol"],
  category: "general",
  description: "Advanced Native Flow Buttons (The MD Secret)",
  usage: ".testbutton",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    // Trik MD Secret:
    // 1. Menggunakan viewOnceMessageV2 (Type 55)
    // 2. NativeFlowMessage dengan buttons
    // 3. Menambahkan contextInfo lengkap dengan ad-reply
    // 4. Memasukkan dummy business_owner_jid

    const buttons = [
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "Ping ⏱️",
          id: ".ping",
        }),
      },
      {
        name: "cta_url",
        buttonParamsJson: JSON.stringify({
          display_text: "Source Code 🌐",
          url: "https://github.com/naruyaizumi/baileys",
          merchant_url: "https://github.com/naruyaizumi/baileys",
        }),
      },
      {
        name: "single_select",
        buttonParamsJson: JSON.stringify({
          title: "Select Menu 📂",
          sections: [
            {
              title: "Information",
              rows: [
                { title: "Status", description: "Check Server Status", id: ".status" },
                { title: "Stats", description: "Usage Statistics", id: ".stats" },
              ],
            },
          ],
        }),
      },
    ];

    const interactiveMessage = {
      body: {
        text: "🤖 *MD INTERACTIVE SYSTEM*\n\nJika Anda melihat pesan ini, berarti teknik `viewOnceMessageV2` + `NativeFlow` berhasil bekerja di akun Anda.",
      },
      footer: { text: "© Botwa Multi-Device" },
      header: {
        title: "Botwa MD System",
        hasMediaAttachment: false,
      },
      nativeFlowMessage: {
        buttons: buttons,
        messageParamsJson: JSON.stringify({
          from: "bot",
          templateId: Date.now().toString(),
        }),
      },
      contextInfo: {
        mentionedJid: [m.sender],
        businessOwnerJid: sock.user?.id,
        externalAdReply: {
          title: "Interactive Menu Active",
          body: "Select an option below",
          mediaType: 1,
          renderLargerThumbnail: true,
          thumbnailUrl:
            "https://raw.githubusercontent.com/naruyaizumi/baileys/master/docs/logo.png",
          sourceUrl: "https://github.com/naruyaizumi/baileys",
        },
      },
    };

    const messageContent = proto.Message.fromObject({
      viewOnceMessageV2: {
        message: {
          interactiveMessage: interactiveMessage,
        },
      },
    });

    const msg = generateWAMessageFromContent(m.from, messageContent, {
      userJid: sock.user?.id,
      quoted: m,
    });

    await sock.relayMessage(m.from, msg.message!, {
      messageId: msg.key.id!,
    });
  }
}
