import type { WASocket } from "baileys";
import type { MessageData, PluginCommand } from "../types/index.js";

async function execute(sock: WASocket, m: MessageData, args: string[]): Promise<void> {
  const text = args.join(" ");

  if (text === "") {
    await sock.sendMessage(m.from, { text: "Usage: .say <text>" });
    return;
  }

  await sock.sendMessage(m.from, { text });
}

export const command: PluginCommand = {
  name: "say",
  alias: ["echo"],
  category: "tools",
  description: "Bot will repeat your message",
  usage: ".say hello world",
  execute,
};
