import { converter } from "../library/converter.js";

@Command({
  name: "uppercase",
  alias: ["up"],
  category: "tools",
  description: "Convert text to uppercase",
  usage: ".uppercase <text>",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData, args: string[]): Promise<void> {
    if (args.length === 0) {
      await sock.sendMessage(m.from, { text: "Please provide text to convert." });
      return;
    }

    const text = args.join(" ");
    await sock.sendMessage(m.from, { text: converter.toUpperCase(text) });
  }
}
