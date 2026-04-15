import type { WASocket } from "baileys";
import { converter } from "../library/converter.js";
import type { MessageData, PluginCommand } from "../types/index.js";

async function execute(sock: WASocket, m: MessageData, args: string[]): Promise<void> {
  const text = args.join(" ");

  if (text === "") {
    await sock.sendMessage(m.from, { text: "Usage: .uppercase <text>" });
    return;
  }

  const result = converter.toUpperCase(text);
  await sock.sendMessage(m.from, { text: result });
}

export const command: PluginCommand = {
  name: "uppercase",
  alias: ["upper"],
  category: "tools",
  description: "Convert text to uppercase",
  usage: ".uppercase hello world",
  execute,
};
