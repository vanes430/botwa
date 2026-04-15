import type { Boom } from "@hapi/boom";
import makeWASocket, {
  type AuthenticationState,
  type BaileysEventMap,
  Browsers,
  type ConnectionState,
  DisconnectReason,
  useMultiFileAuthState,
  type WASocket,
} from "baileys";
import pino from "pino";

import { config } from "./config/config.js";
import { functions, type MessageData, userService } from "./library/index.js";
import { logger } from "./library/logger.js";
import { handleMessage, transformMessagesUpsert } from "./modules/index.js";

let pairingCodeRequested = false;
let groupCache = new Map<string, string>();
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 60_000; // 60 seconds cap
const BASE_RECONNECT_DELAY = 1_000; // 1 second base

function calculateBackoff(attempts: number): number {
  const delay = BASE_RECONNECT_DELAY * 2 ** attempts;
  const jitter = Math.random() * 1000;
  return Math.min(delay + jitter, MAX_RECONNECT_DELAY);
}

function resetReconnectAttempts(): void {
  reconnectAttempts = 0;
}

async function getGroupName(sock: WASocket, groupJid: string): Promise<string> {
  if (groupCache.has(groupJid)) {
    return groupCache.get(groupJid)!;
  }
  try {
    const meta = await sock.groupMetadata(groupJid);
    const name = ((meta as unknown as Record<string, unknown>).subject as string) ?? groupJid;
    groupCache.set(groupJid, name);
    return name;
  } catch {
    return groupJid;
  }
}

async function printMessageLog(
  sock: WASocket,
  message: BaileysEventMap["messages.upsert"]["messages"][0]
): Promise<void> {
  const from = message.key.remoteJid ?? "unknown";
  const participant = message.key.participant || "";
  const sender = participant !== "" ? participant : from;
  const body = functions.extractMessageText(message.message);
  const pushName = (message as unknown as Record<string, unknown>).pushName as string | undefined;
  const senderName = pushName ?? "unknown";
  const phoneNumber = sender.split("@")[0]!;

  if (functions.isGroup(from)) {
    const groupName = await getGroupName(sock, from);
    logger.info(`[GROUP] ${groupName} ${senderName}@${phoneNumber} >> ${body || "(empty)"}`);
  } else {
    logger.info(`[PRIVATE] ${senderName}@${phoneNumber} >> ${body || "(empty)"}`);
  }
}

async function setupMessageHandler(sock: WASocket): Promise<void> {
  sock.ev.on("messages.upsert", async (m: BaileysEventMap["messages.upsert"]): Promise<void> => {
    const resolved = transformMessagesUpsert(m);
    const message = resolved.messages[0];

    if (message === undefined) {
      return;
    }

    // Human-like auto-read with random delay
    if (message.key.id !== undefined && config.autoRead === true) {
      const delay = functions.getRandomDelay(2000, 4000);
      await functions.sleep(delay);
      await sock.readMessages([message.key]);
    }

    if (message.message === undefined || resolved.type !== "notify") {
      return;
    }

    const body = functions.extractMessageText(message.message);

    if (body !== "") {
      await printMessageLog(sock, message);
    }

    const from = message.key.remoteJid ?? "";
    const sender = message.key.participant || from;
    const isGroup = functions.isGroup(from);

    const messageData: MessageData = {
      key: message.key,
      message: message.message,
      body,
      from,
      sender,
      isGroup,
      timestamp: message.messageTimestamp as number,
      pushName: message.pushName ?? "",
      quoted: functions.getQuotedMessage(message.message),
    };

    // Extract media info
    const msg = message.message;
    if (msg.imageMessage !== null && msg.imageMessage !== undefined) {
      messageData.media = {
        type: "image",
        mimetype: msg.imageMessage.mimetype ?? "image/jpeg",
        caption: msg.imageMessage.caption ?? undefined,
      };
    } else if (msg.videoMessage !== null && msg.videoMessage !== undefined) {
      messageData.media = {
        type: "video",
        mimetype: msg.videoMessage.mimetype ?? "video/mp4",
        caption: msg.videoMessage.caption ?? undefined,
      };
    } else if (msg.audioMessage !== null && msg.audioMessage !== undefined) {
      messageData.media = { type: "audio", mimetype: msg.audioMessage.mimetype ?? "audio/ogg" };
    } else if (msg.stickerMessage !== null && msg.stickerMessage !== undefined) {
      messageData.media = {
        type: "sticker",
        mimetype: msg.stickerMessage.mimetype ?? "image/webp",
      };
    } else if (msg.documentMessage !== null && msg.documentMessage !== undefined) {
      messageData.media = {
        type: "document",
        mimetype: msg.documentMessage.mimetype ?? "application/octet-stream",
      };
    }

    await handleMessage(sock, messageData);
  });
}

function setupConnectionHandler(sock: WASocket): void {
  sock.ev.on("connection.update", async (update: Partial<ConnectionState>): Promise<void> => {
    const { connection, lastDisconnect, qr } = update;

    if (qr !== undefined && config.usePairingCode && !pairingCodeRequested) {
      pairingCodeRequested = true;
      const phoneNumber = config.botNumber.replace(/[^0-9+]/g, "").replace("+", "");
      logger.info(`Requesting pairing code for ${phoneNumber}...`);

      try {
        const code = await sock.requestPairingCode(phoneNumber);
        logger.info(`Pairing code: ${code}`);
        logger.info("Enter this code on WhatsApp > Linked Devices > Link with Pairing Code");
      } catch (error: unknown) {
        logger.error("Failed to request pairing code", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (connection === "open") {
      logger.info("Bot connected successfully!");
      resetReconnectAttempts();

      if (config.alwaysOnline === true) {
        await sock.sendPresenceUpdate("available");
        logger.info("[AlwaysOnline] Presence set to available");
      }
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect: boolean = statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        reconnectAttempts += 1;
        const delay = calculateBackoff(reconnectAttempts);
        logger.info(
          `Connection closed (${statusCode}). Reconnecting in ${Math.round(delay / 1000)}s (attempt ${reconnectAttempts})...`
        );
        await new Promise<void>((resolve): void => {
          setTimeout(resolve, delay);
        });
        await startBot();
      } else {
        logger.error("Connection closed: logged out. Will not reconnect.");
      }
    }
  });
}

async function startBot(): Promise<void> {
  pairingCodeRequested = false;
  groupCache = new Map<string, string>();
  reconnectAttempts = 0;

  const {
    state,
    saveCreds,
  }: {
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
  } = await useMultiFileAuthState(config.sessionName);

  const sock: WASocket = makeWASocket({
    auth: state,
    browser: Browsers.windows("Chrome"),
    logger: pino({ level: config.baileysLogLevel }).child({ class: "baileys" }),
  });

  sock.ev.on("creds.update", saveCreds);

  setupConnectionHandler(sock);
  await setupMessageHandler(sock);
  setupCallHandler(sock);
}

function setupCallHandler(sock: WASocket): void {
  if (config.antiCall !== true) {
    return;
  }

  sock.ev.on("call", async (calls: BaileysEventMap["call"]): Promise<void> => {
    for (const call of calls) {
      if (call.status !== "offer") {
        continue;
      }

      const callerJid = call.from ?? "";
      const callerNumber = callerJid.split("@")[0] ?? "unknown";

      // Skip owners
      if (functions.isOwner(callerJid)) {
        logger.info(`[Anti-Call] Ignoring call from owner: ${callerNumber}`);
        continue;
      }

      logger.info(`[Anti-Call] Rejecting call from ${callerNumber}`);

      try {
        await sock.rejectCall(call.id, callerJid);

        const warnings = await userService.addWarning(callerJid);
        const maxWarnings = 3;

        if (warnings >= maxWarnings) {
          await sock.sendMessage(callerJid, {
            text: `📵 You have been blocked for calling ${warnings} times.`,
          });
          await sock.updateBlockStatus(callerJid, "block");
          logger.warn(`[Anti-Call] Blocked ${callerNumber} after ${warnings} calls.`);
        } else {
          await sock.sendMessage(callerJid, {
            text: `📵 Calls are not accepted. Warning ${warnings}/${maxWarnings}. Calling again will result in a block.`,
          });
        }
      } catch (error: unknown) {
        logger.error(`[Anti-Call] Failed to handle call from ${callerNumber}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  });
}

export { startBot };
