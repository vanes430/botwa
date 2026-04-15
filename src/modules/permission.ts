import { config } from "../config/config.js";
import { MultiFileDatabase } from "../library/database.js";
import { logger } from "../library/logger.js";

export type UserRole = "owner" | "admin" | "member" | "banned";

export interface UserPermission {
  role: UserRole;
  bannedUntil?: number; // timestamp, undefined = permanent
  banReason?: string;
  bannedAt?: string;
  bannedBy?: string;
}

const db = new MultiFileDatabase();
const permissions = db.collection<UserPermission>("permissions");

function getRole(userId: string): UserRole {
  const normalized = userId.replace(/[^0-9]/g, "");

  if (
    config.ownerNumber.some((owner: string): boolean =>
      normalized.includes(owner.replace(/[^0-9]/g, ""))
    )
  ) {
    return "owner";
  }

  return "member";
}

async function getUserPermission(userId: string): Promise<UserPermission> {
  const normalized = userId.replace(/[^0-9]/g, "");
  const stored = await permissions.get(normalized);

  if (stored === null) {
    return { role: getRole(userId) };
  }

  // Check if ban expired
  if (stored.bannedUntil !== undefined && Date.now() > stored.bannedUntil) {
    await permissions.set(normalized, { role: getRole(userId) });
    logger.info(`[Permission] Ban expired for ${normalized}`);
    return { role: getRole(userId) };
  }

  return stored;
}

async function setUserRole(userId: string, role: UserRole): Promise<void> {
  const normalized = userId.replace(/[^0-9]/g, "");
  const current = await getUserPermission(normalized);
  await permissions.set(normalized, { ...current, role });
}

async function banUser(
  userId: string,
  reason: string,
  durationMs?: number,
  by?: string
): Promise<void> {
  const normalized = userId.replace(/[^0-9]/g, "");
  const bannedUntil = durationMs !== undefined ? Date.now() + durationMs : undefined;

  await permissions.set(normalized, {
    role: "banned",
    bannedUntil,
    banReason: reason,
    bannedAt: new Date().toISOString(),
    bannedBy: by,
  });

  logger.info(
    `[Permission] Banned ${normalized}: ${reason}${durationMs !== undefined ? ` (${Math.round(durationMs / 60000)}min)` : " (permanent)"}`
  );
}

async function unbanUser(userId: string): Promise<boolean> {
  const normalized = userId.replace(/[^0-9]/g, "");
  const current = await getUserPermission(normalized);

  if (current.role !== "banned") {
    return false;
  }

  await permissions.set(normalized, { role: getRole(`${normalized}@s.whatsapp.net`) });
  logger.info(`[Permission] Unbanned ${normalized}`);
  return true;
}

async function hasAccess(userId: string, requiredRole: UserRole): Promise<boolean> {
  const perm = await getUserPermission(userId);

  if (perm.role === "banned") {
    return false;
  }

  const hierarchy: Record<UserRole, number> = { owner: 4, admin: 3, member: 2, banned: 1 };
  return hierarchy[perm.role] >= hierarchy[requiredRole];
}

export { banUser, getUserPermission, hasAccess, setUserRole, unbanUser };
