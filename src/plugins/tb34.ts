import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb34",
  category: "general",
  description: "Test 34: Address Message NativeFlow",
  usage: ".tb34",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const msg = generateWAMessageFromContent(
      m.from,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              header: { title: "🤖 *Address Mode*", hasMediaAttachment: false },
              body: {
                text: "Mengetes apakah tombol tipe Alamat (Address) dapat muncul di HP Anda.",
              },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "address_message",
                    buttonParamsJson: JSON.stringify({
                      display_text: "Pilih Alamat",
                      id: "addr-1",
                    }),
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
