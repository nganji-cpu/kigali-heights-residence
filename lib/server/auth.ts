import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import type { AuthUser, UserRole } from "@/types";
import { ApiError } from "./errors";

export const SESSION_COOKIE_NAME = "khr_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const BCRYPT_ROUNDS = 12;
const LOGIN_WINDOW_MINUTES = 15;
const MAX_FAILURES_PER_EMAIL = 5;
const MAX_FAILURES_PER_IP = 25;

/* ------------------------------------------------------------------------- */
/* Passwords                                                                 */
/* ------------------------------------------------------------------------- */

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------------- */
/* Token helpers                                                             */
/* ------------------------------------------------------------------------- */

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  };
}

/* ------------------------------------------------------------------------- */
/* Sessions                                                                  */
/* ------------------------------------------------------------------------- */

interface SessionUserRow extends RowDataPacket {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: AuthUser["status"];
  createdAt: string;
  sessionId: number;
  expiresAt: string;
}

/** Creates a DB-backed session and sets the HTTP-only cookie. */
export async function startSession(userId: number): Promise<void> {
  try {
    const pool = getPool();
    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

    await pool.query(
      `INSERT INTO sessions (user_id, token_hash, expires_at)
       VALUES (?, ?, ?)`,
      [userId, tokenHash, expiresAt],
    );

    const store = await cookies();
    store.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(expiresAt));
  } catch (error) {
    console.warn("Database unavailable during startSession:", error);
  }
}

/**
 * Resolves the signed-in user from the session cookie. Expired and suspended
 * sessions are ignored. The last-used timestamp is refreshed at most hourly so
 * every request does not cause a write.
 */
export async function getSessionContext(): Promise<{ user: AuthUser; tokenHash: string } | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const tokenHash = hashToken(token);
    const pool = getPool();
    const [rows] = await pool.query<SessionUserRow[]>(
      `SELECT
         u.id,
         u.full_name AS fullName,
         u.email,
         u.phone,
         u.role,
         u.status,
         u.created_at AS createdAt,
         s.id AS sessionId,
         s.expires_at AS expiresAt
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?
         AND s.expires_at > NOW()
         AND u.status = 'active'
       LIMIT 1`,
      [tokenHash],
    );

    const row = rows[0];
    if (!row) return null;

    await pool.query(
      `UPDATE sessions
          SET last_used_at = NOW()
        WHERE id = ?
          AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL 1 HOUR)`,
      [Number(row.sessionId)],
    );

    return {
      user: {
        id: Number(row.id),
        fullName: row.fullName,
        email: row.email,
        phone: row.phone,
        role: row.role,
        status: row.status,
        createdAt: row.createdAt,
      },
      tokenHash,
    };
  } catch (error) {
    console.warn("Database unavailable during getSessionContext:", error);
    return null;
  }
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const context = await getSessionContext();
  return context?.user ?? null;
}

/** Destroys the current session row and clears the cookie. */
export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      const pool = getPool();
      await pool.query("DELETE FROM sessions WHERE token_hash = ?", [hashToken(token)]);
    } catch (error) {
      console.warn("Database unavailable during endSession:", error);
    }
  }

  store.delete(SESSION_COOKIE_NAME);
}

/** Server-component guard: signed-in customers only. */
export async function requirePageUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Server-component guard for role-specific areas. */
export async function requirePageRole(roles: UserRole[]): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) {
    redirect(user.role === "customer" ? "/dashboard" : "/admin");
  }
  return user;
}

/**
 * Server-component guard for the operations portal. Unauthenticated visitors
 * are sent to the administrator sign-in page (never the customer login), while
 * signed-in customers are returned to their own dashboard.
 *
 * This resolves the user from the database on every request, so a forged or
 * expired cookie cannot bypass the role check.
 */
export async function requireAdminPage(
  roles: UserRole[] = ["admin", "staff"],
): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (!roles.includes(user.role)) {
    redirect(user.role === "customer" ? "/dashboard" : "/admin/login");
  }
  return user;
}

/** Route-handler guard: throws safe 401/403 errors instead of redirecting. */
export async function requireApiUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new ApiError(401, "AUTH_REQUIRED", "Please sign in to continue.");
  }
  return user;
}

export async function requireApiRole(roles: UserRole[]): Promise<AuthUser> {
  const user = await requireApiUser();
  if (!roles.includes(user.role)) {
    throw new ApiError(403, "FORBIDDEN", "You do not have access to that function.");
  }
  return user;
}

/* ------------------------------------------------------------------------- */
/* Login rate limiting (database-backed)                                     */
/* ------------------------------------------------------------------------- */

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function hashIp(ip: string): string {
  const secret = process.env.AUTH_SECRET ?? "khr-local-login-attempts";
  return createHash("sha256").update(`${secret}:${ip}`).digest("hex");
}

interface CountRow extends RowDataPacket {
  total: number;
}

async function countRecentFailures(column: "email" | "ip_hash", value: string): Promise<number> {
  try {
    const pool = getPool();
    const [rows] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) AS total
         FROM login_attempts
        WHERE ${column} = ?
          AND success = 0
          AND attempted_at > DATE_SUB(NOW(), INTERVAL ${LOGIN_WINDOW_MINUTES} MINUTE)`,
      [value],
    );
    return Number(rows[0]?.total ?? 0);
  } catch (error) {
    console.warn("Database unavailable, bypassing failure count check:", error);
    return 0;
  }
}

export interface RateLimitResult {
  limited: boolean;
  retryAfterSeconds: number;
  reason: "email" | "ip" | null;
}

export async function checkLoginRateLimit(
  email: string,
  ipHash: string,
): Promise<RateLimitResult> {
  try {
    const [emailFailures, ipFailures] = await Promise.all([
      countRecentFailures("email", email),
      countRecentFailures("ip_hash", ipHash),
    ]);

    if (emailFailures >= MAX_FAILURES_PER_EMAIL) {
      return { limited: true, retryAfterSeconds: LOGIN_WINDOW_MINUTES * 60, reason: "email" };
    }
    if (ipFailures >= MAX_FAILURES_PER_IP) {
      return { limited: true, retryAfterSeconds: LOGIN_WINDOW_MINUTES * 60, reason: "ip" };
    }
  } catch (error) {
    console.warn("Database unavailable during rate limit check:", error);
  }
  return { limited: false, retryAfterSeconds: 0, reason: null };
}

export async function recordLoginAttempt(
  email: string,
  ipHash: string,
  success: boolean,
): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(
      `INSERT INTO login_attempts (email, ip_hash, success) VALUES (?, ?, ?)`,
      [email, ipHash, success ? 1 : 0],
    );

    if (success) {
      await pool.query(
        "DELETE FROM login_attempts WHERE email = ? AND ip_hash = ? AND success = 0",
        [email, ipHash],
      );
    }
  } catch (error) {
    console.warn("Database unavailable during recordLoginAttempt:", error);
  }
}