import { proto } from "baileys";
import { config } from "../config/config.js";
import { BaseCommand } from "../types/index.js";
import { Command } from "./decorators.js";
import { globalQueue } from "./global-queue.js";
import { logger } from "./logger.js";
import { sessionManager } from "./session-manager.js";

/**
 * Menempelkan variabel-variabel penting ke globalThis agar
 * bisa diakses di seluruh file tanpa import berulang.
 */
(globalThis as { Command: typeof Command }).Command = Command;
(globalThis as { BaseCommand: typeof BaseCommand }).BaseCommand = BaseCommand;
(globalThis as { config: typeof config }).config = config;
(globalThis as { logger: typeof logger }).logger = logger;
(globalThis as { proto: typeof proto }).proto = proto;
(globalThis as { globalQueue: typeof globalQueue }).globalQueue = globalQueue;
(globalThis as { sessionManager: typeof sessionManager }).sessionManager = sessionManager;
(globalThis as { totalMessages: number }).totalMessages = 0;
