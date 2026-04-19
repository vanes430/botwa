import type { WASocket } from "baileys";
import { config } from "../config/config.js";
import { functions } from "../library/index.js";
import { trackCommand } from "../plugins/stats.js";
import { getCommand } from "./plugin-loader.js";

const cooldowns = new Map<string, number>();

async function handleMessage(sock: WASocket, data: MessageData): Promise<void> {
  // 1. Check for active session
  const session = sessionManager.get(data.sender);
  if (session !== undefined) {
    const cmd = getCommand(session.pluginName);
    if (cmd !== undefined) {
      globalQueue.enqueue({
        sock,
        data,
        commandName: `session:${session.pluginName}`,
        execute: async () => {
          await executeCommand(sock, data, cmd, [], `session:${session.pluginName}`);
        },
      });
      return;
    }
  }

  // 2. Regular command parsing
  const parsed = functions.parseCommand(data.body);

  if (parsed === null) {
    return;
  }

  const { command, args } = parsed;
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
  globalQueue.enqueue({
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
  // 1. Final permission checks
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

  // 2. Human-like behaviors (mark as read & typing)
  if (config.autoRead === true) {
    await functions.sleep(functions.getRandomDelay(2000, 4000));
    await functions.markAsRead(
      sock,
      data.from,
      data.originalKey.participant || undefined,
      data.originalKey.id!,
      data.timestamp,
      data.isGroup,
      data.originalKey
    );
  }

  if (config.autoTyping === true) {
    await showHumanTyping(sock, data.from);
  }

  // 3. Set cooldown and execute
  functions.setCooldown(cooldowns, data.sender);

  try {
    await cmd.execute(sock, data, args);
    await trackCommand(data);
    logger.info(`[Worker] DONE: ${commandName} by ${data.sender}`);
  } catch (error: unknown) {
    logger.error(`[Worker] Error executing ${commandName}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    await sock.sendMessage(data.from, {
      text: "An error occurred while executing the command.",
    });
  }
}

/**
 * Simulasi mengetik manusia
 */
async function showHumanTyping(sock: WASocket, from: string): Promise<void> {
  const thinkingDelay = functions.getRandomDelay(400, 750);
  await functions.sleep(thinkingDelay);

  await sock.sendPresenceUpdate("composing", from);

  const typingDelay = functions.getRandomDelay(1500, 2500);
  await functions.sleep(typingDelay);

  await sock.sendPresenceUpdate("paused", from);

  const postTypingDelay = functions.getRandomDelay(500, 1000);
  await functions.sleep(postTypingDelay);
}

export { handleMessage };
