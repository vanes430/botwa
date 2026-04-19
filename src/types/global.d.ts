import type { WASocket as _WASocket, proto as _proto } from "baileys";
import type { Command as _Command } from "../library/decorators.js";
import type {
  BaseCommand as _BaseCommand,
  MessageData as _MessageData,
  PluginCommand as _PluginCommand,
} from "./index.js";
import type { config as _config } from "../config/config.js";
import type { logger as _logger } from "../library/logger.js";
import type { globalQueue as _globalQueue } from "../library/global-queue.js";
import type { sessionManager as _sessionManager } from "../library/session-manager.js";
import type { HttpClient as _HttpClient } from "../library/http-client.js";

declare global {
  // Types
  type WASocket = _WASocket;
  type MessageData = _MessageData;
  type PluginCommand = _PluginCommand;

  // Values / Classes / Functions
  const proto: typeof _proto;
  const Command: typeof _Command;
  const BaseCommand: typeof _BaseCommand;
  const config: typeof _config;
  const logger: typeof _logger;
  const globalQueue: typeof _globalQueue;
  const sessionManager: typeof _sessionManager;
  const http: _HttpClient;
  const startupTimestamp: number;
  const totalMessages: number;
}
