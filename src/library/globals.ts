import { proto } from "baileys";
import { config } from "../config/config.js";
import { BaseCommand } from "../types/index.js";
import { Command } from "./decorators.js";
import { globalQueue } from "./global-queue.js";
import { httpClient } from "./http-client.js";
import { logger } from "./logger.js";
import { sessionManager } from "./session-manager.js";

/**
 * Menempelkan variabel-variabel penting ke globalThis agar
 * bisa diakses di seluruh file tanpa import berulang.
 */
const g = globalThis as unknown as Record<string, unknown>;

g.Command = Command;
g.BaseCommand = BaseCommand;
g.config = config;
g.logger = logger;
g.proto = proto;
g.globalQueue = globalQueue;
g.sessionManager = sessionManager;
g.http = httpClient;
g.totalMessages = 0;
