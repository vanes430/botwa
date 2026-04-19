import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb9",
  category: "general",
  description: "Test 9: V2 Wrapper + NativeFlow",
  usage: ".tb9",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const messageContent = proto.Message.fromObject({
      viewOnceMessageV2: {
        message: {
          interactiveMessage: proto.Message.InteractiveMessage.create({
            header: proto.Message.InteractiveMessage.Header.create({
              title: "🤖 *Botwa V2*",
              hasMediaAttachment: false,
            }),
            body: proto.Message.InteractiveMessage.Body.create({
              text: "Test 9 menggunakan wrapper ViewOnceV2 dengan NativeFlow murni.",
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: "© Botwa MD" }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({ display_text: "Button 1", id: ".ping" }),
                },
              ],
              messageVersion: 1,
            }),
            contextInfo: {
              businessOwnerJid: sock.user?.id,
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
