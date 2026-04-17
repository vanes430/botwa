import util from "node:util";
import type { Boom } from "@hapi/boom";
import makeWASocket, {
  type AuthenticationState,
  Browsers,
  type ConnectionState,
  DisconnectReason,
  useMultiFileAuthState,
  type WASocket,
} from "baileys";
import pino from "pino";

import { calculateBackoff } from "./core/connection-logic.js";
import { setupCallHandler } from "./handlers/call.js";
import { setupMessageUpsert } from "./handlers/message.js";

let pairingCodeRequested = false;
let groupCache = new Map<string, string>();
let reconnectAttempts = 0;

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
      logger.info(`Requesting pairing code for ${phoneNumber}...`);
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        logger.info(`Pairing code: ${code}`);
      } catch (error) {
        logger.error(`Pairing error: ${String(error)}`);
      }
    }

    if (connection === "open") {
      logger.info("Bot connected successfully!");
      reconnectAttempts = 0;
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

async function startBot(): Promise<void> {
  pairingCodeRequested = false;
  groupCache = new Map<string, string>();

  // Aggressive Monkey Patch to suppress Baileys/Libsignal logs
  const filter = (chunk: string | Uint8Array): boolean => {
    const str = chunk?.toString() || "";
    return (
      str.includes("Closing session") || str.includes("SessionEntry") || str.includes("_chains")
    );
  };

  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);

  // @ts-expect-error - Overriding complex signature
  process.stdout.write = (
    chunk: string | Uint8Array,
    encoding?: string | ((err?: Error | null | undefined) => void),
    callback?: (err?: Error | null | undefined) => void
  ) => {
    if (filter(chunk)) return true;
    return originalStdoutWrite(
      chunk,
      encoding as string,
      callback as (err?: Error | null | undefined) => void
    );
  };

  // @ts-expect-error - Overriding complex signature
  process.stderr.write = (
    chunk: string | Uint8Array,
    encoding?: string | ((err?: Error | null | undefined) => void),
    callback?: (err?: Error | null | undefined) => void
  ) => {
    if (filter(chunk)) return true;
    return originalStderrWrite(
      chunk,
      encoding as string,
      callback as (err?: Error | null | undefined) => void
    );
  };

  // Specifically patch console.info since libsignal uses it
  const originalInfo = console.info;
  console.info = (...args: unknown[]) => {
    if (args.length > 0 && typeof args[0] === "string" && args[0].includes("Closing session")) {
      return;
    }
    originalInfo(...args);
  };

  // Patch util.inspect as Baileys might be using it to dump the object
  const originalInspect = util.inspect;
  // @ts-expect-error - Overriding complex signature
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
    await useMultiFileAuthState(config.sessionName);

  // Menggunakan logger pino dengan level dari config untuk meredam log internal Baileys
  const baileysLogger = pino({
    level: config.baileysLogLevel || "silent",
    // Mencegah output objek yang terlalu verbose ke console
    enabled: config.baileysLogLevel !== "silent",
  });

  const sock: WASocket = makeWASocket({
    auth: state,
    browser: Browsers.windows("Chrome"),
    logger: baileysLogger,
  });

  sock.ev.on("creds.update", saveCreds);

  setupConnectionHandler(sock);
  await setupMessageUpsert(sock, getGroupName);
  setupCallHandler(sock);
}

export { startBot };
