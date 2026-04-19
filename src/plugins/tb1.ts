import type { WASocket } from "baileys";
import { generateWAMessageFromContent } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb1",
  category: "general",
  description: "Test 1: Classic Template Message",
  usage: ".tb1",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const template = {
      hydratedTemplate: {
        hydratedContentText:
          "🤖 *Test 1: Template Message*\n\nIni adalah tombol tipe Hydrated Template jadul.",
        hydratedFooterText: "Botwa MD",
        hydratedButtons: [
          { index: 1, quickReplyButton: { displayText: "Tombol 1", id: ".ping" } },
          { index: 2, quickReplyButton: { displayText: "Tombol 2", id: ".menu" } },
        ],
      },
    };

    const msg = generateWAMessageFromContent(
      m.from,
      { templateMessage: template },
      { userJid: sock.user?.id, quoted: m }
    );
    await sock.relayMessage(m.from, msg.message!, { messageId: msg.key.id! });
  }
}
