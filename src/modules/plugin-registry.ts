import { logger } from "../library/logger.js";
import type { PluginCommand } from "../types/index.js";

export interface CategoryMeta {
  emoji: string;
  displayName: string;
}

const CATEGORY_MAP: Record<string, CategoryMeta> = {
  general: { emoji: "📋", displayName: "General" },
  tools: { emoji: "🛠️", displayName: "Tools" },
  owner: { emoji: "👑", displayName: "Owner" },
  downloader: { emoji: "📥", displayName: "Downloader" },
  search: { emoji: "🔍", displayName: "Search" },
  group: { emoji: "👥", displayName: "Group" },
  fun: { emoji: "🎮", displayName: "Fun" },
  ai: { emoji: "🤖", displayName: "AI" },
  sticker: { emoji: "🎨", displayName: "Sticker" },
  islamic: { emoji: "☪️", displayName: "Islamic" },
  random: { emoji: "🎲", displayName: "Random" },
};

export function getCategoryMeta(category: string): CategoryMeta {
  return (
    CATEGORY_MAP[category.toLowerCase()] ?? {
      emoji: "📦",
      displayName: category.charAt(0).toUpperCase() + category.slice(1),
    }
  );
}

export interface GroupedCommand {
  command: PluginCommand;
  badges: string[];
}

interface PluginRegistry {
  commands: Map<string, PluginCommand>;
  categories: Set<string>;
}

const registry: PluginRegistry = {
  commands: new Map<string, PluginCommand>(),
  categories: new Set<string>(),
};

function existsInRegistry(name: string): boolean {
  return registry.commands.has(name.toLowerCase());
}

function registerPlugin(cmd: PluginCommand): void {
  registry.commands.set(cmd.name.toLowerCase(), cmd);
  registry.categories.add(cmd.category);

  if (cmd.alias !== undefined) {
    for (const alias of cmd.alias) {
      registry.commands.set(alias.toLowerCase(), cmd);
    }
  }
}

function unregisterPlugin(pluginName: string): void {
  for (const key of registry.commands.keys()) {
    const entry = registry.commands.get(key);
    if (entry !== undefined && entry.name === pluginName) {
      registry.commands.delete(key);
    }
  }
}

function getCommand(name: string): PluginCommand | undefined {
  return registry.commands.get(name.toLowerCase());
}

function getAllCommands(): PluginCommand[] {
  return Array.from(registry.commands.values()).filter(
    (cmd: PluginCommand, index: number, self: PluginCommand[]): boolean =>
      self.findIndex((c: PluginCommand): boolean => c.name === cmd.name) === index
  );
}

function getCategories(): string[] {
  return Array.from(registry.categories);
}

function getGroupedCommands(): Map<string, GroupedCommand[]> {
  const grouped = new Map<string, GroupedCommand[]>();
  const seen = new Set<string>();

  for (const cmd of registry.commands.values()) {
    if (seen.has(cmd.name)) {
      continue;
    }
    seen.add(cmd.name);

    const badges: string[] = [];
    if (cmd.isOwner === true) {
      badges.push("🔒");
    }
    if (cmd.isGroup === true) {
      badges.push("👥");
    }

    const entry: GroupedCommand = { command: cmd, badges };
    const existing = grouped.get(cmd.category) ?? [];
    existing.push(entry);
    grouped.set(cmd.category, existing);
  }

  return grouped;
}

function printCommandList(): void {
  const grouped: Record<string, string[]> = {};
  for (const cmd of getAllCommands()) {
    if (grouped[cmd.category] === undefined) {
      grouped[cmd.category] = [];
    }
    grouped[cmd.category]!.push(cmd.name);
  }

  logger.info("Available commands:");
  for (const [category, commands] of Object.entries(grouped)) {
    logger.info(`  ${category}: ${commands.join(", ")}`);
  }
}

export {
  existsInRegistry,
  getAllCommands,
  getCategories,
  getCommand,
  getGroupedCommands,
  printCommandList,
  registerPlugin,
  registry,
  unregisterPlugin,
};
