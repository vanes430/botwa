import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { logger } from "./logger.js";

export interface Collection<T = Record<string, unknown>> {
  get(id: string): Promise<T | null>;
  set(id: string, value: T): Promise<void>;
  delete(id: string): Promise<boolean>;
  has(id: string): Promise<boolean>;
  list(): Promise<MapEntry<T>[]>;
  clear(): Promise<void>;
  size(): Promise<number>;
}

export interface MapEntry<T> {
  id: string;
  value: T;
}

export interface DatabaseOptions {
  dataDir?: string;
}

const DEFAULT_DATA_DIR = "./database";

class MultiFileDatabase {
  private dataDir: string;

  constructor(options?: DatabaseOptions) {
    this.dataDir = options?.dataDir ?? DEFAULT_DATA_DIR;
    this.ensureDir(this.dataDir);
  }

  private ensureDir(dirPath: string): void {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      logger.info(`[DB] Created directory: ${dirPath}`);
    }
  }

  private collectionPath(collection: string): string {
    return join(this.dataDir, collection);
  }

  private filePath(collection: string, id: string): string {
    return join(this.collectionPath(collection), `${id}.json`);
  }

  private readRaw(path: string): Record<string, unknown> | null {
    if (!existsSync(path)) {
      return null;
    }
    try {
      const content = readFileSync(path, "utf-8");
      return JSON.parse(content) as Record<string, unknown>;
    } catch (error: unknown) {
      logger.error(`[DB] Failed to read file: ${path}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private writeRaw(path: string, data: Record<string, unknown>): void {
    const dir = path.split("/").slice(0, -1).join("/");
    this.ensureDir(dir);
    writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
  }

  collection<T = Record<string, unknown>>(name: string): Collection<T> {
    const collectionPath = this.collectionPath(name);
    this.ensureDir(collectionPath);

    const db = this;

    return {
      async get(id: string): Promise<T | null> {
        const path = db.filePath(name, id);
        const raw = db.readRaw(path);
        if (raw === null) {
          return null;
        }
        return raw as unknown as T;
      },

      async set(id: string, value: T): Promise<void> {
        const path = db.filePath(name, id);
        const serializable = value as unknown as Record<string, unknown>;
        db.writeRaw(path, serializable);
      },

      async delete(id: string): Promise<boolean> {
        const path = db.filePath(name, id);
        if (existsSync(path)) {
          rmSync(path);
          return true;
        }
        return false;
      },

      async has(id: string): Promise<boolean> {
        return existsSync(db.filePath(name, id));
      },

      async list(): Promise<MapEntry<T>[]> {
        const dirPath = db.collectionPath(name);
        if (!existsSync(dirPath)) {
          return [];
        }
        const files = readdirSync(dirPath).filter((f: string): boolean => f.endsWith(".json"));
        const entries: MapEntry<T>[] = [];
        for (const file of files) {
          const id = file.replace(/\.json$/, "");
          const path = join(dirPath, file);
          const data = db.readRaw(path);
          if (data !== null) {
            entries.push({ id, value: data as unknown as T });
          }
        }
        return entries;
      },

      async clear(): Promise<void> {
        const dirPath = db.collectionPath(name);
        if (existsSync(dirPath)) {
          rmSync(dirPath, { recursive: true, force: true });
          db.ensureDir(dirPath);
        }
      },

      async size(): Promise<number> {
        const dirPath = db.collectionPath(name);
        if (!existsSync(dirPath)) {
          return 0;
        }
        const files = readdirSync(dirPath).filter((f: string): boolean => f.endsWith(".json"));
        return files.length;
      },
    };
  }
}

export { MultiFileDatabase };
