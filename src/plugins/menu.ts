import type { WASocket } from "baileys";
import { config } from "../config/config.js";
import { Command, userService } from "../library/index.js";
import { getCategories, getCategoryMeta, getGroupedCommands } from "../modules/plugin-loader.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "menu",
  alias: ["help", "commands"],
  category: "general",
  description: "Show all available commands",
  usage: ".menu",
})
export default class MenuCommand extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const grouped = getGroupedCommands();
    const categories = getCategories();
    const totalCommands = Array.from(grouped.values()).reduce((acc, curr) => acc + curr.length, 0);

    const userStats = await userService.getStats(m.sender);

    // Sort categories by display order
    const order = [
      "general",
      "tools",
      "search",
      "downloader",
      "group",
      "fun",
      "owner",
      "ai",
      "sticker",
      "islamic",
      "random",
    ];
    const sortedCategories = [...categories].sort((a, b): number => {
      const ai = order.indexOf(a.toLowerCase());
      const bi = order.indexOf(b.toLowerCase());
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    // Build header
    let menuText = `╭━━━〔 *${config.botName}* 〕━━━┈⊷\n`;
    menuText += `┃ 📋 Total: *${totalCommands}* Commands\n`;
    menuText += `┃ 🔖 Prefix: *${config.prefix[0]}*\n`;
    menuText += `┃ 👤 User: *${m.pushName}*\n`;
    menuText += `┃ 📊 Usage: *${userStats.commandCount}* cmds\n`;
    menuText += `╰━━━━━━━━━━━━━━━┈⊷\n\n`;

    // Build each category
    for (const category of sortedCategories) {
      const meta = getCategoryMeta(category);
      const cmds = grouped.get(category) ?? [];

      // Sort commands
      cmds.sort((a, b): number => {
        const aWeight = (a.command.isOwner ? 100 : 0) + (a.command.isAdmin ? 10 : 0);
        const bWeight = (b.command.isOwner ? 100 : 0) + (b.command.isAdmin ? 10 : 0);
        return aWeight - bWeight;
      });

      menuText += `╭━━━〔 *${meta.emoji} ${meta.displayName}* 〕━━━┈⊷\n`;
      for (const entry of cmds) {
        const cmd = entry.command;
        const aliasText =
          cmd.alias !== undefined && cmd.alias.length > 0 ? ` (${cmd.alias.join(", ")})` : "";

        const badges = [...entry.badges];
        if (cmd.isAdmin) {
          badges.push("👑");
        }
        const badgeText = badges.length > 0 ? ` ${badges.join("")}` : "";

        menuText += `┃ ◦ ${cmd.name}${aliasText}${badgeText}\n`;
        menuText += `┃   └─ _${cmd.description ?? "No description"}_\n`;
      }
      menuText += `╰━━━━━━━━━━━━━━━┈⊷\n\n`;
    }

    // Footer
    menuText += `💡 _Usage: ${config.prefix[0]}<command> [args]_\n`;
    menuText += `🔒=Owner | 👥=Group | 👑=Admin`;

    await sock.sendMessage(m.from, { text: menuText });
  }
}
