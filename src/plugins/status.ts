import os from "node:os";
import type { WASocket } from "baileys";
import { config } from "../config/config.js";
import { converter } from "../library/converter.js";
import { Command, userService } from "../library/index.js";
import { getAllCommands } from "../modules/plugin-loader.js";
import { BaseCommand, type MessageData } from "../types/index.js";

const startTime = new Date();

@Command({
  name: "status",
  alias: ["info", "botstat"],
  category: "owner",
  description: "Check bot and system status",
  usage: ".status",
  isOwner: true,
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const commands = getAllCommands();
    const pluginCount = commands.length;
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    const totalMem = os.totalmem() / 1024 / 1024 / 1024;

    const userStats = await userService.getStats(m.sender);

    let statusText = "╭━━━〔 *SYSTEM STATUS* 〕━━━┈⊷\n";
    statusText += `┃ 👤 *User Stats*\n`;
    statusText += `┃  ├─ Commands: ${userStats.commandCount}\n`;
    statusText += `┃  └─ Warnings: ${userStats.warnings}\n`;
    statusText += `┃\n`;
    statusText += `┃ 🤖 *Bot Info*\n`;
    statusText += `┃  ├─ Uptime: ${converter.formatDuration(Date.now() - startTime.getTime())}\n`;
    statusText += `┃  ├─ Memory: ${used.toFixed(2)} MB / ${totalMem.toFixed(2)} GB\n`;
    statusText += `┃  ├─ Platform: ${os.platform()} ${os.release()}\n`;
    statusText += `┃  └─ Plugins: ${pluginCount}\n`;
    statusText += `┃\n`;
    statusText += `┃ ⚙️ *Config*\n`;
    statusText += `┃  ├─ Prefix: ${config.prefix.join(" ")}\n`;
    statusText += `┃  └─ Self: ${config.selfCommand ? "ON" : "OFF"}\n`;
    statusText += `╰━━━━━━━━━━━━━━━┈⊷`;

    await sock.sendMessage(m.from, { text: statusText });
  }
}
