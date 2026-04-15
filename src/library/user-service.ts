import { type Collection, MultiFileDatabase } from "./database.js";

export interface UserStats {
  id: string;
  commandCount: number;
  lastUsed: number;
  warnings: number;
}

class UserService {
  private db: MultiFileDatabase;
  private collection: Collection<UserStats>;

  constructor() {
    this.db = new MultiFileDatabase();
    this.collection = this.db.collection<UserStats>("user-stats");
  }

  async getStats(id: string): Promise<UserStats> {
    const stats = await this.collection.get(id);
    if (stats !== null) {
      return stats;
    }

    const newStats: UserStats = {
      id,
      commandCount: 0,
      lastUsed: Date.now(),
      warnings: 0,
    };
    await this.collection.set(id, newStats);
    return newStats;
  }

  async incrementCommand(id: string): Promise<void> {
    const stats = await this.getStats(id);
    stats.commandCount += 1;
    stats.lastUsed = Date.now();
    await this.collection.set(id, stats);
  }

  async addWarning(id: string): Promise<number> {
    const stats = await this.getStats(id);
    stats.warnings += 1;
    await this.collection.set(id, stats);
    return stats.warnings;
  }

  async resetWarnings(id: string): Promise<void> {
    const stats = await this.getStats(id);
    stats.warnings = 0;
    await this.collection.set(id, stats);
  }
}

export const userService = new UserService();
