import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { logger } from "../library/logger.js";
import type { BaseCommand, PluginCommand } from "../types/index.js";
import { registerPlugin } from "./plugin-registry.js";
import { validatePlugin } from "./plugin-validator.js";

export { reloadSinglePlugin, watchPlugins } from "./plugin-hot-reload.js";
export type { CategoryMeta, GroupedCommand } from "./plugin-registry.js";
export {
  getAllCommands,
  getCategories,
  getCategoryMeta,
  getCommand,
  getGroupedCommands,
  printCommandList,
  registry,
} from "./plugin-registry.js";

async function loadPlugins(pluginsDir: string): Promise<void> {
  const absolutePath = resolve(pluginsDir);

  if (!(await dirExists(absolutePath))) {
    logger.error(`Plugins directory not found: ${absolutePath}`);
    return;
  }

  const files = await readdir(absolutePath);
  const tsFiles = files.filter((f: string): boolean => f.endsWith(".ts") || f.endsWith(".js"));

  if (tsFiles.length === 0) {
    logger.warn("No plugin files found in plugins directory");
    return;
  }

  let loadedCount = 0;
  let failedCount = 0;

  for (const file of tsFiles) {
    const filePath = join(absolutePath, file);

    if ((await stat(filePath)).isDirectory()) {
      continue;
    }

    try {
      const modulePath = filePath.startsWith("file://") ? filePath : `file://${filePath}`;
      const pluginModule = (await import(modulePath)) as Record<string, unknown>;

      let pluginCommand: PluginCommand | undefined;

      // Cek apakah itu Decorator-based (Default Export adalah Class)
      if (typeof pluginModule.default === "function") {
        const CommandClass = pluginModule.default as new () => BaseCommand;
        const instance = new CommandClass();
        const metadata = (instance as { metadata?: PluginCommand }).metadata;

        if (metadata !== undefined) {
          pluginCommand = {
            ...metadata,
            execute: instance.execute.bind(instance),
          };
        }
      }

      // Fallback ke Object-based (export const command)
      if (pluginCommand === undefined) {
        const validation = validatePlugin(pluginModule, file);
        if (!validation.valid) {
          logger.warn(`Skipping ${file}: ${validation.errors.join(", ")}`);
          failedCount += 1;
          continue;
        }
        pluginCommand = (pluginModule as { command: PluginCommand }).command;
      }

      registerPlugin(pluginCommand);
      loadedCount += 1;

      logger.info(`Loaded plugin: ${pluginCommand.name} [${pluginCommand.category}]`);
    } catch (error: unknown) {
      logger.error(`Failed to load plugin ${file}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      failedCount += 1;
    }
  }

  logger.info(`Plugins loaded: ${loadedCount} OK, ${failedCount} failed`);
}

async function dirExists(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

export { loadPlugins };
