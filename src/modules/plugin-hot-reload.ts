import { watch } from "node:fs";
import { stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { logger } from "../library/logger.js";
import type { PluginCommand } from "../types/index.js";
import { registerPlugin, unregisterPlugin } from "./plugin-registry.js";

async function reloadSinglePlugin(filePath: string): Promise<void> {
  const fileName = basename(filePath);
  const pluginName = fileName.replace(/\.(ts|js)$/, "");

  try {
    const moduleUrl = filePath.startsWith("file://") ? filePath : `file://${filePath}`;
    unregisterPlugin(pluginName);

    const freshModule = (await import(moduleUrl)) as Record<string, unknown>;
    const pluginCommand = freshModule.command as PluginCommand | undefined;

    if (pluginCommand === undefined) {
      logger.warn(`[Hot-Reload] Skipped ${fileName}: no 'command' export`);
      return;
    }

    registerPlugin(pluginCommand);
    logger.info(`[Hot-Reload] Plugin reloaded: ${pluginCommand.name} [${pluginCommand.category}]`);
  } catch (error: unknown) {
    logger.error(`[Hot-Reload] Failed to reload ${fileName}`, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function watchPlugins(pluginsDir: string): void {
  const absolutePath = resolve(pluginsDir);

  watch(absolutePath, async (event: string, filename: string | null): Promise<void> => {
    if (filename === null) {
      return;
    }

    if (!filename.endsWith(".ts") && !filename.endsWith(".js")) {
      return;
    }

    if (event === "change") {
      logger.info(`[Hot-Reload] Change detected: ${filename}`);
      await reloadSinglePlugin(join(absolutePath, filename));
    } else if (event === "rename") {
      const filePath = join(absolutePath, filename);
      try {
        const fileStat = await stat(filePath);
        if (fileStat.isFile()) {
          logger.info(`[Hot-Reload] New plugin: ${filename}`);
          await reloadSinglePlugin(filePath);
        }
      } catch {
        const pluginName = filename.replace(/\.(ts|js)$/, "");
        unregisterPlugin(pluginName);
        logger.info(`[Hot-Reload] Plugin removed: ${pluginName}`);
      }
    }
  });

  logger.info(`[Hot-Reload] Watching: ${absolutePath}`);
}

export { reloadSinglePlugin, watchPlugins };
