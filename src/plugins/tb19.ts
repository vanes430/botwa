import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb19",
  category: "general",
  description: "Test 19: NativeFlow with CTA Buttons",
  usage: ".tb19",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const messageContent = proto.Message.fromObject({
      viewOnceMessageV2: {
        message: {
          interactiveMessage: {
            header: { title: "🤖 *CTA Buttons*", hasMediaAttachment: false },
            body: {
              text: "Mengetes apakah tombol Link (CTA) lebih mudah muncul dibanding Quick Reply.",
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "cta_url",
                  buttonParamsJson: JSON.stringify({
                    display_text: "Buka GitHub",
                    url: "https://github.com/naruyaizumi/baileys",
                    merchant_url: "https://github.com/naruyaizumi/baileys",
                  }),
                },
                {
                  name: "cta_copy",
                  buttonParamsJson: JSON.stringify({
                    display_text: "Salin Kode",
                    id: "copy-code",
                    copy_code: "BUN-BAILEYS-BOT",
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
