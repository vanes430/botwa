import type { WASocket } from "baileys";
import { MultiFileDatabase } from "../library/index.js";
import type { MessageData, PluginCommand } from "../types/index.js";

interface UserStats {
  userId: string;
  username: string;
  commandCount: number;
  lastUsed: string;
  firstSeen: string;
}

const db = new MultiFileDatabase();
const stats = db.collection<UserStats>("user-stats");

async function execute(sock: WASocket, m: MessageData, args: string[]): Promise<void> {
  const target = args.length > 0 ? args[0]! : m.sender;
  const userId = target.replace(/[^0-9]/g, "");

  const data = await stats.get(userId);

  if (data === null) {
    await sock.sendMessage(m.from, {
      text: `No stats found for @${userId}.`,
      mentions: [`${userId}@s.whatsapp.net`],
    });
    return;
  }

  const msg =
    `*Stats for ${data.username}*\n\n` +
    `Commands used: ${data.commandCount}\n` +
    `First seen: ${data.firstSeen}\n` +
    `Last used: ${data.lastUsed}`;

  await sock.sendMessage(m.from, { text: msg });
}

async function trackCommand(m: MessageData): Promise<void> {
  const userId = m.sender.replace(/[^0-9]/g, "");
  const now = new Date().toISOString();

  const existing = await stats.get(userId);

  if (existing === null) {
    await stats.set(userId, {
      userId,
      username: m.pushName || "Unknown",
      commandCount: 1,
      lastUsed: now,
      firstSeen: now,
    });
  } else {
    await stats.set(userId, {
      ...existing,
      commandCount: existing.commandCount + 1,
      lastUsed: now,
    });
  }
}

export const command: PluginCommand = {
  name: "stats",
  alias: ["userstats"],
  category: "general",
  description: "Show command usage stats for a user",
  usage: ".stats [@mention or number]",
  execute,
};

export { trackCommand };
