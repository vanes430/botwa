import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb30",
  category: "general",
  description: "Test 30: Fake Device Sync + Classic Buttons",
  usage: ".tb30",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const msg = generateWAMessageFromContent(
      m.from,
      {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2,
            },
            buttonsMessage: {
              contentText:
                "🤖 *Test 30: Sync Proxy*\nMemaksa sinkronisasi perangkat agar tombol muncul.",
              buttons: [{ buttonId: ".ping", buttonText: { displayText: "Ping" }, type: 1 }],
              headerType: 1,
            },
          },
        },
      },
      { userJid: sock.user?.id, quoted: m }
    );

    await sock.relayMessage(m.from, msg.message!, { messageId: msg.key.id! });
  }
}
