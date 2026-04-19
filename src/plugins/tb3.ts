import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb3",
  category: "general",
  description: "Test 3: Pure InteractiveMessage (Native Flow)",
  usage: ".tb3",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const msg = generateWAMessageFromContent(
      m.from,
      {
        interactiveMessage: proto.Message.InteractiveMessage.create({
          body: proto.Message.InteractiveMessage.Body.create({
            text: "🤖 *Test 3: Pure InteractiveMessage*\n\nMurni tanpa ViewOnce wrapper.",
          }),
          footer: proto.Message.InteractiveMessage.Footer.create({ text: "Botwa MD" }),
          header: proto.Message.InteractiveMessage.Header.create({
            title: "Native Flow V2",
            subtitle: "Test",
            hasMediaAttachment: false,
          }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            buttons: [
              {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({ display_text: "Tombol 1", id: ".ping" }),
              },
              {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({ display_text: "Tombol 2", id: ".menu" }),
              },
            ],
            messageVersion: 1,
          }),
        }),
      },
      { userJid: sock.user?.id, quoted: m }
    );

    await sock.relayMessage(m.from, msg.message!, { messageId: msg.key.id! });
  }
}
