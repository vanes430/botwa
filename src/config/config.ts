export interface BotConfig {
  botNumber: string;
  ownerNumber: string[];
  prefix: string[];
  botName: string;
  sessionName: string;
  cooldown: number;
  maxRetries: number;
  autoRead: boolean;
  autoTyping: boolean;
  alwaysOnline: boolean;
  selfCommand: boolean;
  antiCall: boolean;
  usePairingCode: boolean;
  baileysLogLevel: "trace" | "debug" | "info" | "warn" | "error" | "silent";
  maxFiles: number;
  maxFileSizeKB: number;
  rawMessageLog: boolean;
  rawBaileysLog: boolean;
}

export const config: Readonly<BotConfig> = Object.freeze({
  botNumber: "6281226485398",
  ownerNumber: ["6281226485398"],
  prefix: [".", "!", "#", "/"],
  botName: "WhatsApp Bot",
  sessionName: "./auth_session",
  cooldown: 3000,
  maxRetries: 3,
  autoRead: true,
  autoTyping: true,
  alwaysOnline: false,
  selfCommand: true,
  antiCall: false,
  usePairingCode: true,
  baileysLogLevel: "silent",
  maxFiles: 10,
  maxFileSizeKB: 5120,
  httpTimeout: 15000, // 15 detik
  circuitBreakerThreshold: 5, // 5 kali gagal berturut-turut
  circuitBreakerResetTimeout: 30000, // 30 detik sebelum mencoba lagi
  rawMessageLog: false,
  rawBaileysLog: false,
});
