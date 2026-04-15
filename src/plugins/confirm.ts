import type { WASocket } from "baileys";
import { Command, sessionManager } from "../library/index.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "confirm",
  category: "general",
  description: "Test interactive session (State Machine)",
  usage: ".confirm",
})
export default class ConfirmCommand extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const session = sessionManager.get(m.sender);

    // Jika sedang dalam sesi
    if (session !== undefined) {
      const input = m.body.toLowerCase().trim();

      if (input === "yes" || input === "y") {
        await sock.sendMessage(m.from, { text: "✅ You said YES! Action confirmed." });
        sessionManager.delete(m.sender);
      } else if (input === "no" || input === "n") {
        await sock.sendMessage(m.from, { text: "❌ You said NO. Action cancelled." });
        sessionManager.delete(m.sender);
      } else {
        await sock.sendMessage(m.from, { text: "⚠️ Please reply with *yes* or *no*." });
      }
      return;
    }

    // Jika belum ada sesi, buat sesi baru
    await sock.sendMessage(m.from, {
      text: "❓ Are you sure you want to proceed? (Reply *yes* or *no*)",
    });

    sessionManager.create(m.sender, this.metadata.name, "awaiting_confirmation");
  }
}
