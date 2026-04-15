import type { WASocket } from "baileys";
import { Command } from "../library/index.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "say",
  category: "tools",
  description: "Repeat the message provided",
  usage: ".say <text>",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData, args: string[]): Promise<void> {
    if (args.length === 0) {
      await sock.sendMessage(m.from, { text: "Please provide a message to repeat." });
      return;
    }

    const text = args.join(" ");
    await sock.sendMessage(m.from, { text });
  }
}
