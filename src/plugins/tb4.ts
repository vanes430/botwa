import type { WASocket } from "baileys";
import { generateWAMessageFromContent } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb4",
  category: "general",
  description: "Test 4: Classic ListMessage (Menu)",
  usage: ".tb4",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    // ListMessage adalah fitur lama WhatsApp Business yang seringkali
    // lolos filter karena strukturnya lebih mirip pesan teks biasa
    // namun memiliki tombol "Menu" di bagian bawah.

    const messageContent = {
      listMessage: {
        title: "🤖 *Test 4: Classic ListMessage*",
        description:
          "Ini adalah format List Menu murni yang biasanya kebal blokir karena bukan berupa tombol sejajar.",
        buttonText: "Buka Pilihan",
        listType: 1,
        sections: [
          {
            title: "Daftar Perintah",
            rows: [
              { title: "Ping", rowId: ".ping", description: "Cek respons server" },
              { title: "Menu Utama", rowId: ".menu", description: "Lihat semua perintah" },
            ],
          },
        ],
        footerText: "Botwa MD",
      },
    };

    const msg = generateWAMessageFromContent(m.from, messageContent, {
      userJid: sock.user?.id,
      quoted: m,
    });
    await sock.relayMessage(m.from, msg.message!, { messageId: msg.key.id! });
  }
}
