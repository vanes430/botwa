import type { WASocket } from "baileys";
import { config } from "../config/config.js";
import { commandQueue, functions, logger } from "../library/index.js";
import { trackCommand } from "../plugins/stats.js";
import type { MessageData, PluginCommand } from "../types/index.js";
import { getCommand } from "./plugin-loader.js";

const cooldowns = new Map<string, number>();

async function handleMessage(sock: WASocket, data: MessageData): Promise<void> {
  const parsed = functions.parseCommand(data.body);

  if (parsed === null) {
    return;
  }

  const { prefix, command, args } = parsed;
  const cmd = getCommand(command);

  if (cmd === undefined) {
    return;
  }

  // Skip own messages when selfCommand is disabled
  if (config.selfCommand === false && functions.isBotMessage(config.botNumber, data.sender)) {
    return;
  }

  // Validation checks (Middleware) - Perform basic checks before queuing
  if (cmd.isOwner === true && !functions.isOwner(data.sender)) {
    await sock.sendMessage(data.from, { text: "Owner only command!" });
    return;
  }

  if (cmd.isGroup === true && !data.isGroup) {
    await sock.sendMessage(data.from, { text: "This command only works in groups!" });
    return;
  }

  const { onCooldown, remaining } = functions.checkCooldown(
    cooldowns,
    data.sender,
    config.cooldown
  );

  if (onCooldown) {
    await sock.sendMessage(data.from, {
      text: `Please wait ${Math.ceil(remaining / 1000)}s before using this command again.`,
    });
    return;
  }

  // Add to global queue
  commandQueue.enqueue({
    sock,
    data,
    commandName: command,
    execute: async () => {
      await executeCommand(sock, data, cmd, args, command);
    },
  });
}

/**
 * Actual execution logic with humanized behavior
 */
async function executeCommand(
  sock: WASocket,
  data: MessageData,
  cmd: PluginCommand,
  args: string[],
  commandName: string
): Promise<void> {
  // 1. Final permission checks (in case group status/admin changed while in queue)
  if (cmd.isAdmin === true && data.isGroup) {
    const isUserAdmin = await functions.isAdmin(sock, data.from, data.sender);
    if (!isUserAdmin && !functions.isOwner(data.sender)) {
      await sock.sendMessage(data.from, { text: "Admin only command!" });
      return;
    }
  }

  if (cmd.isBotAdmin === true && data.isGroup) {
    const isBotAdmin = await functions.isAdmin(
      sock,
      data.from,
      `${config.botNumber}@s.whatsapp.net`
    );
    if (!isBotAdmin) {
      await sock.sendMessage(data.from, { text: "Bot must be admin to use this command!" });
      return;
    }
  }

  // 2. Human-like typing indicator
  if (config.autoTyping === true) {
    await sock.sendPresenceUpdate("composing", data.from);
    const typingDelay = functions.getRandomDelay(1000, 3000);
    await functions.sleep(typingDelay);
    await sock.sendPresenceUpdate("paused", data.from);
    await functions.sleep(functions.getRandomDelay(300, 800));
  }

  // 3. Set cooldown and execute
  functions.setCooldown(cooldowns, data.sender);

  try {
    await cmd.execute(sock, data, args);
    await trackCommand(data);
    logger.info(`[Worker] Done: ${commandName} by ${data.sender}`);
  } catch (error: unknown) {
    logger.error(`[Worker] Error executing ${commandName}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    await sock.sendMessage(data.from, {
      text: "An error occurred while executing the command.",
    });
  }
}

export { handleMessage };
