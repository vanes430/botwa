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
    await sock.sendMessage(m.from, { react: { text: "⏳", key: m.key } });
    const reactionTime = Date.now() - start;

    await sock.sendMessage(m.from, {
      text: `⏱️ *Ping*\n\nReaction: ${reactionTime}ms\nTotal: ${Date.now() - start}ms`,
    });
  }
}
