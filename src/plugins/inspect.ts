import { Command, logger } from "../library/index.js";
import { BaseCommand } from "../types/index.js";

@Command({
  name: "inspect",
  alias: ["ins", "detail"],
  category: "utility",
  description: "Inspect message details and log to console",
  usage: ".inspect (reply to a message)",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    if (!m.quoted) {
      await sock.sendMessage(m.from, { react: { text: "❌", key: m.key } });
      return;
    }

    logger.info(`Inspect requested by ${m.sender} in ${m.from}`, {
      quoted: m.quoted.message,
    });

    await sock.sendMessage(m.from, { react: { text: "✅", key: m.key } });
  }
}
