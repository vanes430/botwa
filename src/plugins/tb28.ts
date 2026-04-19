import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb28",
  category: "general",
  description: "Test 28: Proto Injection + Location Header",
  usage: ".tb28",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const msg = generateWAMessageFromContent(
      m.from,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: proto.Message.InteractiveMessage.fromObject({
              header: proto.Message.InteractiveMessage.Header.fromObject({
                hasMediaAttachment: true,
                locationMessage: { degreesLatitude: 0, degreesLongitude: 0 },
              }),
              body: proto.Message.InteractiveMessage.Body.fromObject({
                text: "🤖 *Test 28: Location Proxy*\n\nMenyisipkan NativeFlow di bawah objek Lokasi.",
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: [
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({ display_text: "Ping", id: ".ping" }),
                  },
                ],
                messageVersion: 1,
              }),
            }),
          },
        },
      },
      { userJid: sock.user?.id, quoted: m }
    );

    await sock.relayMessage(m.from, msg.message!, { messageId: msg.key.id! });
  }
}
