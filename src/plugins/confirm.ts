import { sessionManager } from "../library/index.js";

@Command({
  name: "confirm",
  category: "general",
  description: "Test interactive session (State Machine)",
  usage: ".confirm",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const session = sessionManager.get(m.sender);

    if (session !== undefined) {
      const input = m.body.toLowerCase().trim();

      if (input === "yes" || input === "y") {
        await sock.sendMessage(m.from, { text: "✅ Action confirmed." });
        sessionManager.delete(m.sender);
      } else if (input === "no" || input === "n") {
        await sock.sendMessage(m.from, { text: "❌ Action cancelled." });
        sessionManager.delete(m.sender);
      } else {
        await sock.sendMessage(m.from, { text: "⚠️ Reply with *yes* or *no*." });
      }
      return;
    }

    await sock.sendMessage(m.from, {
      text: "❓ Proceed? (Reply *yes* or *no*)",
    });

    sessionManager.create(m.sender, this.metadata.name, "awaiting_confirmation");
  }
}
