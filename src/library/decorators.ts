import type { PluginCommand } from "../types/index.js";

/**
 * Metadata untuk Command Decorator
 */
export interface CommandMetadata extends Omit<PluginCommand, "execute"> {}

/**
 * Decorator untuk mendaftarkan class sebagai plugin command.
 * Menempelkan metadata ke prototype class agar bisa dibaca oleh loader.
 */
export function Command(metadata: CommandMetadata): ClassDecorator {
  return (target: object): void => {
    (target as { prototype: { metadata: CommandMetadata } }).prototype.metadata = metadata;
  };
}
