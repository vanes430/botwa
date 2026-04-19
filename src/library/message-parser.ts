import type { proto } from "baileys";
import { config } from "../config/config.js";
import type { MessageData } from "../types/index.js";

/**
 * Mengekstrak teks dari berbagai jenis pesan WhatsApp.
 */
export function extractMessageText(message: proto.IMessage | null | undefined): string {
  if (!message) return "";

  const msg = message;
  if (typeof msg.conversation === "string") return msg.conversation;

  if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;

  if (msg.imageMessage?.caption) return msg.imageMessage.caption;

  if (msg.videoMessage?.caption) return msg.videoMessage.caption;

  // Button & Interactive Responses
  if (msg.buttonsResponseMessage?.selectedDisplayText)
    return msg.buttonsResponseMessage.selectedDisplayText;

  if (msg.templateButtonReplyMessage?.selectedDisplayText)
    return msg.templateButtonReplyMessage.selectedDisplayText;

  if (msg.listResponseMessage?.title) return msg.listResponseMessage.title;

  if (msg.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
    try {
      const params = JSON.parse(
        msg.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson
      );
      return params.id || params.text || "";
    } catch {
      return "";
    }
  }

  return "";
}

/**
 * Mengekstrak informasi pesan yang dikutip (quoted message).
 */
export function getQuotedMessage(
  message: proto.IMessage | null | undefined
): MessageData["quoted"] | undefined {
  const contextInfo = message?.extendedTextMessage?.contextInfo;
  const quotedMsg = contextInfo?.quotedMessage;

  if (!quotedMsg) return undefined;

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

/**
 * Memparsing string menjadi command dan argumen berdasarkan prefix di config.
 */
export function parseCommand(
  body: string
): { prefix: string; command: string; args: string[] } | null {
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
