import type { WASocket } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb26",
  category: "general",
  description: "Test 26: sendMessage with List",
  usage: ".tb26",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    await sock.sendMessage(
      m.from,
      {
        text: "🤖 *Test 26: sendMessage List*\nMembuka menu pilihan.",
        footer: "Botwa MD",
        buttonText: "Lihat Menu",
        sections: [
          {
            title: "Utilitas",
            rows: [
              { title: "Ping", rowId: ".ping", description: "Cek respons" },
              { title: "Menu", rowId: ".menu", description: "Daftar perintah" },
            ],
          },
        ],
      },
      { quoted: m }
    );
  }
}
