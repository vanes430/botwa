import type { WASocket } from "baileys";
import type { MessageData, PluginCommand } from "../types/index.js";

async function execute(sock: WASocket, m: MessageData, _args: string[]): Promise<void> {
  const start = Date.now();

  // Step 1: React with clock emoji
  await sock.sendMessage(m.from, {
    react: {
      text: "⏳",
      key: m.key,
    },
  });

  const reactionTime = Date.now() - start;

  // Step 2: Reply with detailed ping result
  const _replyStart = Date.now();
  await sock.sendMessage(m.from, {
    text: `⏱️ *Ping*\n\nReaction: ${reactionTime}ms\nTotal: ${Date.now() - start}ms`,
    quoted: {
      key: m.key,
      message: {
        conversation: m.body,
      },
    },
  });

  // Step 3: React with checkmark to user's message
  await sock.sendMessage(m.from, {
    react: {
      text: "✅",
      key: m.key,
    },
  });
}

export const command: PluginCommand = {
  name: "ping",
  alias: ["pong", "test"],
  category: "general",
  description: "Check if bot is alive",
  usage: ".ping",
  execute,
};
