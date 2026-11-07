import "server-only";
import { randomBytes } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import type { UserRole } from "@/types";
import { findUserByEmail } from "./accounts";
import { hashToken } from "./auth";
import { ApiError } from "./errors";

export const RESET_TOKEN_TTL_MINUTES = 30;
const RESET_WINDOW_MINUTES = 15;
const MAX_REQUESTS_PER_EMAIL = 3;
const MAX_REQUESTS_PER_IP = 10;

export interface PasswordResetRequestResult {
  /** Raw token, returned only when an active account exists. Never stored. */
  token: string | null;
  expiresInMinutes: number;
  limited: boolean;
  retryAfterSeconds: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

async function countRecentRequests(
  column: "email" | "ip_hash",
  value: string,
): Promise<number> {
  const pool = getPool();
  const [rows] = await pool.query<CountRow[]>(
    `SELECT COUNT(*) AS total
       FROM password_reset_tokens
      WHERE ${column} = ?
        AND created_at > DATE_SUB(NOW(), INTERVAL ${RESET_WINDOW_MINUTES} MINUTE)`,
    [value],
  );
  return Number(rows[0]?.total ?? 0);
}

/**
 * Issues a single-use password reset token.
 *
 * The same generic result shape is returned whether or not the email belongs to
 * an account; callers must not branch their response on `token`. Requests are
 * recorded even for unknown addresses so the per-IP limit cannot be bypassed by
 * cycling email addresses.
 */
export async function requestPasswordReset(
  email: string,
  ipHash: string,
  allowedRoles?: UserRole[],
): Promise<PasswordResetRequestResult> {
  const pool = getPool();

  // Housekeeping: keep the table small without affecting usable tokens.
  await pool.query(
    "DELETE FROM password_reset_tokens WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)",
  );

  const [emailCount, ipCount] = await Promise.all([
    countRecentRequests("email", email),
    countRecentRequests("ip_hash", ipHash),
  ]);

  if (emailCount >= MAX_REQUESTS_PER_EMAIL || ipCount >= MAX_REQUESTS_PER_IP) {
    return {
      token: null,
      expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
      limited: true,
      retryAfterSeconds: RESET_WINDOW_MINUTES * 60,
    };
  }

  const user = await findUserByEmail(email);
  const activeUser =
    user &&
    user.status === "active" &&
    (!allowedRoles || allowedRoles.includes(user.role))
      ? user
      : null;

  if (!activeUser) {
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, email, token_hash, expires_at, ip_hash)
       VALUES (NULL, ?, NULL, NULL, ?)`,
      [email, ipHash],
    );
    return {
      token: null,
      expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
      limited: false,
      retryAfterSeconds: 0,
    };
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  const connection = await pool.getConnection();
  let committed = false;
  try {
    await connection.beginTransaction();

    // Only the newest link should work.
    await connection.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL",
      [activeUser.id],
    );
    await connection.query(
      `INSERT INTO password_reset_tokens
         (user_id, email, token_hash, expires_at, ip_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [activeUser.id, email, tokenHash, expiresAt, ipHash],
    );

    await connection.commit();
    committed = true;
  } catch (error) {
    if (!committed) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return {
    token,
    expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
    limited: false,
    retryAfterSeconds: 0,
  };
}

interface ResetTokenRow extends RowDataPacket {
  id: number;
  userId: number | null;
  expiresAt: string | null;
  usedAt: string | null;
}

/**
 * Consumes a reset token and replaces the account password.
 *
 * The token row is locked for the duration of the transaction, marked used and
 * every existing session is deleted. A replayed link therefore fails even if it
 * is used twice within the expiry window.
 */
export async function consumePasswordResetToken(
  token: string,
  passwordHash: string,
): Promise<number> {
  const tokenHash = hashToken(token);
  const pool = getPool();
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<ResetTokenRow[]>(
      `SELECT id, user_id AS userId, expires_at AS expiresAt, used_at AS usedAt
         FROM password_reset_tokens
        WHERE token_hash = ?
        LIMIT 1
        FOR UPDATE`,
      [tokenHash],
    );

    const row = rows[0];
    if (
      !row ||
      row.userId === null ||
      row.usedAt !== null ||
      !row.expiresAt ||
      new Date(row.expiresAt).getTime() <= Date.now()
    ) {
      throw new ApiError(
        400,
        "INVALID_RESET_TOKEN",
        "That password reset link is invalid or has expired. Please request a new one.",
      );
    }

    await connection.query<ResultSetHeader>(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?",
      [Number(row.id)],
    );
    await connection.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL",
      [Number(row.userId)],
    );
    await connection.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      passwordHash,
      Number(row.userId),
    ]);
    await connection.query("DELETE FROM sessions WHERE user_id = ?", [Number(row.userId)]);

    await connection.commit();
    committed = true;
    return Number(row.userId);
  } catch (error) {
    if (!committed) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
