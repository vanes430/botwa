import { config } from "../config/config.js";

/**
 * Mengecek apakah pengirim adalah owner bot.
 */
export function isOwner(sender: string): boolean {
  const normalizedSender = sender.replace(/[^0-9]/g, "");
  return config.ownerNumber.some((owner: string): boolean =>
    normalizedSender.includes(owner.replace(/[^0-9]/g, ""))
  );
}

/**
 * Mengecek apakah JID berasal dari grup.
 */
export function isGroup(from: string): boolean {
  return from.endsWith("@g.us");
}

/**
 * Mengecek apakah user adalah admin di grup tersebut.
 */
export async function isAdmin(
  sock: WASocket,
  groupJid: string,
  participant: string
): Promise<boolean> {
  try {
    const metadata = await sock.groupMetadata(groupJid);
    const participantData = metadata.participants.find(
      (p: { id: string; admin: string | null | undefined }): boolean => p.id === participant
    );
    return participantData?.admin !== undefined && participantData?.admin !== null;
  } catch {
    return false;
  }
}

/**
 * Mengecek apakah pengirim adalah bot itu sendiri.
 */
export function isBotMessage(botNumber: string, sender: string): boolean {
  const normalizedBot = botNumber.replace(/[^0-9]/g, "");
  const normalizedSender = sender.replace(/[^0-9]/g, "");
  return normalizedSender.includes(normalizedBot);
}

// Re-export from specialized modules for backward compatibility
import { extractMessageText, getQuotedMessage, parseCommand } from "./message-parser.js";
import { markAsRead } from "./sync-utils.js";
import { getRandomDelay, sleep } from "./time-utils.js";

/**
 * Cek cooldown user.
 */
export function checkCooldown(
  cooldowns: Map<string, number>,
  sender: string,
  cooldownMs: number
): { onCooldown: boolean; remaining: number } {
  const lastUsed = cooldowns.get(sender);

  if (lastUsed === undefined) {
    return { onCooldown: false, remaining: 0 };
  }

  const elapsed = Date.now() - lastUsed;
  if (elapsed < cooldownMs) {
    return { onCooldown: true, remaining: cooldownMs - elapsed };
  }

  return { onCooldown: false, remaining: 0 };
}

/**
 * Set timestamp cooldown untuk user.
 */
export function setCooldown(cooldowns: Map<string, number>, sender: string): void {
  cooldowns.set(sender, Date.now());
}

export const functions = {
  isOwner,
  isGroup,
  isAdmin,
  isBotMessage,
  checkCooldown,
  setCooldown,
  extractMessageText,
  getQuotedMessage,
  parseCommand,
  markAsRead,
  getRandomDelay,
  sleep,
};
