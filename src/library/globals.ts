import { proto } from "baileys";
import { config } from "../config/config.js";
import { BaseCommand } from "../types/index.js";
import { Command } from "./decorators.js";
import { logger } from "./logger.js";

/**
 * Menempelkan variabel-variabel penting ke globalThis agar
 * bisa diakses di seluruh file tanpa import berulang.
 */
(globalThis as { Command: typeof Command }).Command = Command;
(globalThis as { BaseCommand: typeof BaseCommand }).BaseCommand = BaseCommand;
(globalThis as { config: typeof config }).config = config;
(globalThis as { logger: typeof logger }).logger = logger;
(globalThis as { proto: typeof proto }).proto = proto;
