import { functions } from "../library/index.js";

@Command({
  name: "ping",
  alias: ["p"],
  category: "general",
  description: "Check bot response time",
  usage: ".ping",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const start = Date.now();

    // Send reaction first
    await sock.sendMessage(m.from, { react: { text: "⏳", key: m.key } });
    const reactionTime = Date.now() - start;

    // Small human-like pause between reaction and typing/sending the final result
    await functions.sleep(functions.getRandomDelay(500, 1000));

    await sock.sendMessage(m.from, {
      text: `⏱️ *Ping*\n\nReaction: ${reactionTime}ms\nTotal: ${Date.now() - start}ms`,
    });
  }
}
