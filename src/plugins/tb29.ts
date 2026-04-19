import type { WASocket } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb29",
  category: "general",
  description: "Test 29: Multi-Layer Context Injection",
  usage: ".tb29",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const msg = generateWAMessageFromContent(
      m.from,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              body: {
                text: "🤖 *Test 29: Context Proxy*\nTombol dengan injeksi contextInfo ganda.",
              },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({ display_text: "Ping", id: ".ping" }),
                  },
                ],
                messageVersion: 1,
              },
              contextInfo: {
                mentionedJid: [m.sender],
                businessOwnerJid: sock.user?.id,
                externalAdReply: {
                  title: "Botwa Active",
                  mediaType: 1,
                  renderLargerThumbnail: false,
                  sourceUrl: "https://wa.me/" + sock.user?.id?.split(":")[0],
                },
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
