// ============================================
// WhatsApp Bot - Startup Entry Point
// This file only handles initialization.
// All bot logic is in src/bot.ts
// ============================================

import "./src/library/globals.js";
import { garbageCollector, initFileLogger, logger } from "./src/library/index.js";
import { loadPlugins, watchPlugins } from "./src/modules/index.js";
import { startBot } from "./src/bot.js";

async function main(): Promise<void> {
  initFileLogger({ logDir: "./logs", maxFiles: 10, maxFileSizeKB: 5120 });
  garbageCollector.start();


  logger.info("Starting WhatsApp Bot...");
  await loadPlugins("./src/plugins");
  watchPlugins("./src/plugins");

  await startBot();
}

main().catch((error: unknown) => {
  logger.error("Fatal error", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
