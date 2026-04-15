import type { SessionData } from "../types/index.js";
import { logger } from "./logger.js";

/**
 * SessionManager untuk mengelola State Machine (percakapan interaktif)
 */
class SessionManager {
  private sessions = new Map<string, SessionData>();
  private readonly DEFAULT_TIMEOUT = 120_000; // 2 menit timeout default

  /**
   * Membuat sesi baru untuk user
   */
  public create(
    id: string,
    pluginName: string,
    state: string,
    data: Record<string, unknown> = {},
    timeoutMs: number = this.DEFAULT_TIMEOUT
  ): void {
    const expiresAt = Date.now() + timeoutMs;
    this.sessions.set(id, { id, pluginName, state, data, expiresAt });
    logger.info(`[Session] Created for ${id} by ${pluginName} (state: ${state})`);
  }

  /**
   * Mengambil sesi user yang masih aktif (belum expired)
   */
  public get(id: string): SessionData | undefined {
    const session = this.sessions.get(id);
    if (session === undefined) return undefined;

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(id);
      logger.info(`[Session] Expired for ${id}`);
      return undefined;
    }

    return session;
  }

  /**
   * Menghapus sesi user
   */
  public delete(id: string): void {
    this.sessions.delete(id);
    logger.info(`[Session] Deleted for ${id}`);
  }

  /**
   * Mengecek apakah user sedang dalam sesi interaktif
   */
  public has(id: string): boolean {
    return this.get(id) !== undefined;
  }

  /**
   * Membersihkan semua sesi yang sudah expired secara berkala
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(id);
      }
    }
  }
}

export const sessionManager = new SessionManager();
