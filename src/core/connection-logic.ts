import { logger } from "../library/index.js";

const MAX_RECONNECT_DELAY = 60_000;
const BASE_RECONNECT_DELAY = 1_000;

/**
 * Menghitung jeda waktu untuk reconnect (Exponential Backoff)
 */
export function calculateBackoff(attempts: number): number {
  const delay = BASE_RECONNECT_DELAY * 2 ** attempts;
  const jitter = Math.random() * 1000;
  return Math.min(delay + jitter, MAX_RECONNECT_DELAY);
}

/**
 * Logika logging pesan ke konsol
 */
export async function printMessageLog(
  sock: WASocket,
  message: proto.IWebMessageInfo,
  functions: {
    extractMessageText: (m: proto.IMessage | null | undefined) => string;
    isGroup: (jid: string) => boolean;
  },
  getGroupName: (sock: WASocket, jid: string) => Promise<string>
): Promise<void> {
  const from = message.key.remoteJid ?? "unknown";
  const sender = message.key.participant || from;
  const body = functions.extractMessageText(message.message);
  const senderName = message.pushName ?? "unknown";
  const phoneNumber = sender.split("@")[0]!;

  if (functions.isGroup(from)) {
    const groupName = await getGroupName(sock, from);
    logger.info(`[GROUP] ${groupName} ${senderName}@${phoneNumber} >> ${body || "(empty)"}`);
  } else {
    logger.info(`[PRIVATE] ${senderName}@${phoneNumber} >> ${body || "(empty)"}`);
  }
}
