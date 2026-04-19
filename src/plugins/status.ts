import os from "node:os";
import { Command } from "../library/decorators.js";
import { getAllCommands } from "../modules/plugin-registry.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "status",
  alias: ["stats", "info", "system"],
  category: "owner",
  description: "Display detailed system monitor dashboard",
  usage: ".status",
})
export default class StatusCommand extends BaseCommand {
  async execute(sock: WASocket, data: MessageData): Promise<void> {
    const uptime = this.formatUptime(process.uptime());
    const ram = this.formatRam();
    const cpu = os.cpus()[0]?.model || "Unknown CPU";
    const platform = `${os.platform()} ${os.arch()} (${os.release()})`;
    const totalPlugins = getAllCommands().length;
    const nodeVersion = process.version;
    const bunVersion = (process.versions as Record<string, string | undefined>).bun || "N/A";

    const dashboard = [
      `📊 *SYSTEM MONITOR DASHBOARD*`,
      `──────────────────────────`,
      `🤖 *Bot Information*`,
      `• Name: ${config.botName}`,
      `• Uptime: ${uptime}`,
      `• Plugins: ${totalPlugins} active`,
      `• Total Messages: ${totalMessages.toLocaleString()}`,
      ``,
      `💻 *Hardware & System*`,
      `• CPU: ${cpu}`,
      `• RAM: ${ram.used} / ${ram.total}`,
      `• Platform: ${platform}`,
      ``,
      `⚙️ *Runtime Environment*`,
      `• Bun: v${bunVersion}`,
      `• Node: ${nodeVersion}`,
      `• Baileys: Latest (MD)`,
      `──────────────────────────`,
      `_Bot remains online and responsive._`,
    ].join("\n");

    await sock.sendMessage(data.from, {
      text: dashboard,
      contextInfo: {
        externalAdReply: {
          title: "Botwa System Monitor",
          body: `Uptime: ${uptime}`,
          mediaType: 1,
          thumbnailUrl: "https://files.catbox.moe/kxlcll.jpg", // Placeholder cool icon
          sourceUrl: "https://github.com/naruyaizumi/baileys",
          renderLargerThumbnail: false,
        },
      },
    });
  }

  private formatUptime(seconds: number): string {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0) parts.push(`${s}s`);

    return parts.join(" ") || "0s";
  }

  private formatRam(): { used: string; total: string } {
    const totalMem = os.totalmem();

    // Node.js Specific Memory (RSS)
    const memUsage = process.memoryUsage();
    const nodeUsed = (memUsage.rss / 1024 / 1024).toFixed(2);

    return {
      used: `${nodeUsed} MB (Node)`,
      total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB (System)`,
    };
  }
}
