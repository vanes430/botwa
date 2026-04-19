import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb12",
  category: "general",
  description: "Test 12: Refined NativeFlow (V1)",
  usage: ".tb12",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const messageContent = proto.Message.fromObject({
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: { title: "🤖 *Refined NativeFlow*", hasMediaAttachment: false },
            body: { text: "Struktur ini menggunakan messageVersion 1 dan templateId unik." },
            footer: { text: "© Botwa MD" },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({ display_text: "Button Test", id: ".ping" }),
                },
              ],
              messageParamsJson: JSON.stringify({ templateId: "test-" + Date.now() }),
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
