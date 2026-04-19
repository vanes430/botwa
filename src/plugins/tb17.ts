import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb17",
  category: "general",
  description: "Test 17: V2 + NativeFlow + Params",
  usage: ".tb17",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const messageContent = proto.Message.fromObject({
      viewOnceMessageV2: {
        message: {
          interactiveMessage: {
            header: { title: "🤖 *Botwa V2 Params*", hasMediaAttachment: false },
            body: {
              text: "Menambahkan metadata templateId spesifik agar client beta tidak bingung.",
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({ display_text: "Ping", id: ".ping" }),
                },
              ],
              messageParamsJson: JSON.stringify({ from: "bot", templateId: `md-v2-${Date.now()}` }),
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
