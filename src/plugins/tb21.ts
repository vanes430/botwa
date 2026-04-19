import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb21",
  category: "general",
  description: "Test 21: NativeFlow with Location Header",
  usage: ".tb21",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const messageContent = proto.Message.fromObject({
      viewOnceMessageV2: {
        message: {
          interactiveMessage: {
            header: {
              title: "🤖 *Location Trigger*",
              hasMediaAttachment: true,
              locationMessage: {
                degreesLatitude: -6.1754,
                degreesLongitude: 106.8272,
                name: "Botwa MD Headquarter",
                address: "Jakarta, Indonesia",
              },
            },
            body: { text: "Mengetes apakah Header Lokasi dapat memicu tombol." },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({ display_text: "Ping", id: ".ping" }),
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
