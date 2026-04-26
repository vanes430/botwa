import { config } from "../config/config.js";
import type { MessageData } from "../types/index.js";

/**
 * Mengekstrak teks dari berbagai jenis pesan WhatsApp.
 */
export function extractMessageText(message: proto.IMessage | null | undefined): string {
  if (!message) return "";

  // Helper to normalize viewOnce messages
  const getMessageContent = (m: proto.IMessage): proto.IMessage => {
    if (m.viewOnceMessage?.message) return m.viewOnceMessage.message;
    if (m.viewOnceMessageV2?.message) return m.viewOnceMessageV2.message;
    if (m.viewOnceMessageV2Extension?.message) return m.viewOnceMessageV2Extension.message;
    if (m.ephemeralMessage?.message) return m.ephemeralMessage.message;
    return m;
  };

  const msg = getMessageContent(message);

  if (typeof msg.conversation === "string") return msg.conversation;

  if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;

  if (msg.imageMessage?.caption) return msg.imageMessage.caption;

  if (msg.videoMessage?.caption) return msg.videoMessage.caption;

  // Button & Interactive Responses
  if (msg.buttonsResponseMessage?.selectedButtonId)
    return msg.buttonsResponseMessage.selectedButtonId;

  if (msg.buttonsResponseMessage?.selectedDisplayText)
    return msg.buttonsResponseMessage.selectedDisplayText;

  if (msg.templateButtonReplyMessage?.selectedId) return msg.templateButtonReplyMessage.selectedId;

  if (msg.listResponseMessage?.singleSelectReply?.selectedRowId)
    return msg.listResponseMessage.singleSelectReply.selectedRowId;

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
  if (!message) return undefined;

  // Extract contextInfo from any message type
  const getContextInfo = (msg: proto.IMessage): proto.IContextInfo | null | undefined => {
    // Try common ones first
    if (msg.extendedTextMessage?.contextInfo) return msg.extendedTextMessage.contextInfo;
    if (msg.imageMessage?.contextInfo) return msg.imageMessage.contextInfo;
    if (msg.videoMessage?.contextInfo) return msg.videoMessage.contextInfo;
    if (msg.stickerMessage?.contextInfo) return msg.stickerMessage.contextInfo;
    if (msg.documentMessage?.contextInfo) return msg.documentMessage.contextInfo;
    if (msg.audioMessage?.contextInfo) return msg.audioMessage.contextInfo;
    if (msg.contactMessage?.contextInfo) return msg.contactMessage.contextInfo;
    if (msg.locationMessage?.contextInfo) return msg.locationMessage.contextInfo;
    if (msg.liveLocationMessage?.contextInfo) return msg.liveLocationMessage.contextInfo;

    // Fallback search through all keys for contextInfo
    for (const key of Object.keys(msg)) {
      const subMsg = msg[key as keyof proto.IMessage];
      if (subMsg && typeof subMsg === "object" && "contextInfo" in subMsg) {
        return (subMsg as { contextInfo: proto.IContextInfo }).contextInfo;
      }
    }
    return undefined;
  };

  const contextInfo = getContextInfo(message);
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
