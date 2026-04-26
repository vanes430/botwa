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
  customPairingCode: string;
  baileysLogLevel: "trace" | "debug" | "info" | "warn" | "error" | "silent";
  maxFiles: number;
  maxFileSizeKB: number;
  rawMessageLog: boolean;
  rawBaileysLog: boolean;
  httpTimeout: number;
  circuitBreakerThreshold: number;
  circuitBreakerResetTimeout: number;
}

export const config: Readonly<BotConfig> = Object.freeze({
  botNumber: "6281226485398",
  ownerNumber: ["6281226485398"],
  prefix: [".", "!", "#", "/"],
  botName: "WhatsApp Bot",
  sessionName: "session.db",
  cooldown: 3000,
  maxRetries: 3,
  autoRead: true,
  autoTyping: true,
  alwaysOnline: false,
  selfCommand: true,
  antiCall: true,
  usePairingCode: true,
  customPairingCode: "VANES430",
  baileysLogLevel: "silent",
  maxFiles: 10,
  maxFileSizeKB: 5120,
  httpTimeout: 15000, // 15 detik
  circuitBreakerThreshold: 5, // 5 kali gagal berturut-turut
  circuitBreakerResetTimeout: 30000, // 30 detik sebelum mencoba lagi
  rawMessageLog: false,
  rawBaileysLog: false,
});
