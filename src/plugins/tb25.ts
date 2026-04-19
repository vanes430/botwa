import type { WASocket } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb25",
  category: "general",
  description: "Test 25: sendMessage with Buttons",
  usage: ".tb25",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    // Menggunakan high-level function sock.sendMessage
    // Baileys akan otomatis menangani pembungkusan (wrapping) yang paling tepat
    // sesuai dengan deteksi versi WhatsApp Anda.

    await sock.sendMessage(
      m.from,
      {
        text: "🤖 *Test 25: sendMessage Buttons*\nIni menggunakan fungsi tingkat tinggi dari Baileys.",
        footer: "Botwa MD",
        buttons: [
          { buttonId: ".ping", buttonText: { displayText: "Ping" }, type: 1 },
          { buttonId: ".menu", buttonText: { displayText: "Menu" }, type: 1 },
        ],
        headerType: 1,
      },
      { quoted: m }
    );
  }
}
