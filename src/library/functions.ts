import type { proto, WASocket } from "baileys";
import { config } from "../config/config.js";
import type { MessageData } from "../types/index.js";

function isOwner(sender: string): boolean {
  const normalizedSender = sender.replace(/[^0-9]/g, "");
  return config.ownerNumber.some((owner: string): boolean =>
    normalizedSender.includes(owner.replace(/[^0-9]/g, ""))
  );
}

function isGroup(from: string): boolean {
  return from.endsWith("@g.us");
}

async function isAdmin(sock: WASocket, groupJid: string, participant: string): Promise<boolean> {
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

function extractMessageText(message: proto.IMessage | null | undefined): string {
  if (message === null || message === undefined) {
    return "";
  }

  const msg = message;

  if (typeof msg.conversation === "string") {
    return msg.conversation;
  }

  if (msg.extendedTextMessage !== null && msg.extendedTextMessage !== undefined) {
    if (typeof msg.extendedTextMessage.text === "string") {
      return msg.extendedTextMessage.text;
    }
  }

  if (msg.imageMessage !== null && msg.imageMessage !== undefined) {
    if (typeof msg.imageMessage.caption === "string") {
      return msg.imageMessage.caption;
    }
  }

  if (msg.videoMessage !== null && msg.videoMessage !== undefined) {
    if (typeof msg.videoMessage.caption === "string") {
      return msg.videoMessage.caption;
    }
  }

  return "";
}

function getQuotedMessage(
  message: proto.IMessage | null | undefined
): MessageData["quoted"] | undefined {
  const quotedMsg = message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quotedMsg === null || quotedMsg === undefined) {
    return undefined;
  }

  const contextInfo = message?.extendedTextMessage?.contextInfo;
  return {
    key: {
      remoteJid: contextInfo?.remoteJid || undefined,
      id: contextInfo?.stanzaId || "",
      participant: contextInfo?.participant || undefined,
    },
    message: quotedMsg,
    sender: contextInfo?.participant || "",
    body: extractMessageText(quotedMsg),
  };
}

function parseCommand(body: string): { prefix: string; command: string; args: string[] } | null {
  for (const prefix of config.prefix) {
    if (body.startsWith(prefix)) {
      const content = body.slice(prefix.length).trimStart();
      const parts = content.split(/\s+/);
      const command = parts[0]!.toLowerCase();
      const args = parts.slice(1);
      return { prefix, command, args };
    }
  }
  return null;
}

function isBotMessage(botNumber: string, sender: string): boolean {
  const normalizedBot = botNumber.replace(/[^0-9]/g, "");
  const normalizedSender = sender.replace(/[^0-9]/g, "");
  return normalizedSender.includes(normalizedBot);
}

function checkCooldown(
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

function setCooldown(cooldowns: Map<string, number>, sender: string): void {
  cooldowns.set(sender, Date.now());
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const functions = {
  isOwner,
  isGroup,
  isAdmin,
  extractMessageText,
  getQuotedMessage,
  parseCommand,
  isBotMessage,
  checkCooldown,
  setCooldown,
  sleep,
  getRandomDelay,
};
