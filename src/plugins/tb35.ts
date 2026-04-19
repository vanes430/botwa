import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb35",
  category: "general",
  description: "Test 35: Send Location NativeFlow",
  usage: ".tb35",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const msg = generateWAMessageFromContent(
      m.from,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              header: { title: "🤖 *Location Mode*", hasMediaAttachment: false },
              body: {
                text: "Mengetes apakah tombol Kirim Lokasi (Send Location) dapat muncul di HP Anda.",
              },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "send_location",
                    buttonParamsJson: JSON.stringify({}),
                  },
                ],
                messageVersion: 1,
              },
            },
          },
        },
      },
      { userJid: sock.user?.id, quoted: m }
    );

    await sock.relayMessage(m.from, msg.message!, { messageId: msg.key.id! });
  }
}
