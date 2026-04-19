import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb7",
  category: "general",
  description: "Test 7: Business Context Native Flow",
  usage: ".tb7",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const messageContent = proto.Message.fromObject({
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: { title: "🤖 *Botwa Business*", hasMediaAttachment: false },
            body: { text: "Teknik ini menggunakan Business Context untuk memaksa render tombol." },
            footer: { text: "© Botwa MD" },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({ display_text: "Ping Bot", id: ".ping" }),
                },
              ],
              messageVersion: 1,
            },
            contextInfo: {
              businessOwnerJid: sock.user?.id,
              deviceListMetadata: {},
              deviceListMetadataVersion: 2,
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
