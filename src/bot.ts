import util from "node:util";
import type { Boom } from "@hapi/boom";
import makeWASocket, {
  type AuthenticationState,
  Browsers,
  type ConnectionState,
  DisconnectReason,
  useSqliteAuthState,
  type WASocket,
} from "baileys";
import pino from "pino";

import { calculateBackoff } from "./core/connection-logic.js";
import { setupCallHandler } from "./handlers/call.js";
import { setupMessageUpsert } from "./handlers/message.js";
import { setupPollHandler } from "./handlers/poll.js";

let pairingCodeRequested = false;
let groupCache = new Map<string, string>();
let reconnectAttempts = 0;
let currentSock: WASocket | null = null;
let isRestarting = false;

async function getGroupName(sock: WASocket, groupJid: string): Promise<string> {
  if (groupCache.has(groupJid)) return groupCache.get(groupJid)!;
  try {
    const meta = await sock.groupMetadata(groupJid);
    const name = meta.subject ?? groupJid;
    groupCache.set(groupJid, name);
    return name;
  } catch {
    return groupJid;
  }
}

function setupConnectionHandler(sock: WASocket): void {
  sock.ev.on("connection.update", async (update: Partial<ConnectionState>): Promise<void> => {
    const { connection, lastDisconnect, qr } = update;

    if (qr !== undefined && config.usePairingCode && !pairingCodeRequested) {
      pairingCodeRequested = true;
      const phoneNumber = config.botNumber.replace(/[^0-9]/g, "");
      logger.info(`Requesting custom pairing code for ${phoneNumber}...`);
      try {
        const code = await sock.requestPairingCode(phoneNumber, config.customPairingCode);
        logger.info(`Pairing code: ${code}`);
      } catch (error) {
        logger.error(`Pairing error: ${String(error)}`);
      }
    }

    if (connection === "open") {
      const duration = (performance.now() - startupTimestamp).toFixed(0);
      logger.info(`Bot connected successfully!`);
      logger.info(`Bot done started : ${duration}ms`);
      reconnectAttempts = 0;
      isRestarting = false;
      if (config.alwaysOnline) await sock.sendPresenceUpdate("available");
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      if (statusCode !== DisconnectReason.loggedOut) {
        reconnectAttempts += 1;
        const delay = calculateBackoff(reconnectAttempts);
        logger.info(`Reconnecting in ${Math.round(delay / 1000)}s...`);
        setTimeout(() => startBot(), delay);
      } else {
        logger.error("Logged out. Manual intervention required.");
      }
    }
  });
}

/**
 * Monkey patch stdout/stderr to detect Bad MAC errors
 */
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

const filterAndRestart = (chunk: string | Uint8Array): boolean => {
  const str = chunk?.toString() || "";

  if (str.includes("Bad MAC") && !isRestarting) {
    isRestarting = true;
    console.error("\n[RESTART] Bad MAC Error detected! Attempting automatic recovery...");

    if (currentSock) {
      try {
        currentSock.logout().catch(() => {});
        currentSock.end(undefined);
      } catch {}
    }

    // Hard restart by exiting - assumed runner will restart (or we use setTimeout)
    // If no external runner, we use startBot()
    setTimeout(() => {
      logger.info("Restarting bot core...");
      startBot();
    }, 2000);
    return true;
  }

  return (
    str.includes("Closing session") ||
    str.includes("SessionEntry") ||
    str.includes("_chains") ||
    str.includes("Removing old closed session")
  );
};

process.stdout.write = (
  chunk: string | Uint8Array,
  encoding?: BufferEncoding | string,
  callback?: (err?: Error | null) => void
) => {
  if (filterAndRestart(chunk)) return true;
  return originalStdoutWrite(
    chunk,
    encoding as BufferEncoding,
    callback as (err?: Error | null) => void
  );
};

process.stderr.write = (
  chunk: string | Uint8Array,
  encoding?: BufferEncoding | string,
  callback?: (err?: Error | null) => void
) => {
  if (filterAndRestart(chunk)) return true;
  return originalStderrWrite(
    chunk,
    encoding as BufferEncoding,
    callback as (err?: Error | null) => void
  );
};

async function startBot(): Promise<void> {
  pairingCodeRequested = false;
  groupCache = new Map<string, string>();

  // Specifically patch console.info since libsignal uses it
  const originalInfo = console.info;
  console.info = (...args: unknown[]) => {
    if (args.length > 0 && typeof args[0] === "string") {
      const msg = args[0];
      if (msg.includes("Closing session") || msg.includes("Removing old closed session")) {
        return;
      }
    }
    originalInfo(...args);
  };

  // Patch util.inspect as Baileys might be using it to dump the object
  const originalInspect = util.inspect;
  util.inspect = (obj: unknown, options?: util.InspectOptions) => {
    if (
      obj &&
      typeof obj === "object" &&
      (obj.constructor?.name === "SessionEntry" || "_chains" in obj)
    ) {
      return "";
    }
    return originalInspect(obj, options);
  };

  const { state, saveCreds }: { state: AuthenticationState; saveCreds: () => Promise<void> } =
    await useSqliteAuthState(config.sessionName);

  const baileysLogger = pino({
    level: config.baileysLogLevel || "silent",
    enabled: config.baileysLogLevel !== "silent",
  });

  const sock: WASocket = makeWASocket({
    auth: state,
    browser: Browsers.windows("Chrome"),
    logger: baileysLogger,
  });

  currentSock = sock;
  sock.ev.on("creds.update", saveCreds);

  setupConnectionHandler(sock);
  await setupMessageUpsert(sock, getGroupName);
  setupCallHandler(sock);
  setupPollHandler(sock);
}

export { startBot };
