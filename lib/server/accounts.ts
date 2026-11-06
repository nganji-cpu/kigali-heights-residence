import "server-only";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import type {
  AdminCustomerSummary,
  AdminStaffSummary,
  AuthUser,
  UserRole,
  UserStatus,
} from "@/types";
import { ApiError } from "./errors";

interface UserRow extends RowDataPacket {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

interface CustomerRow extends RowDataPacket {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  status: UserStatus;
  createdAt: string;
  reservationCount: number;
  totalSpent: number;
}

const USER_SELECT = `
  SELECT
    id,
    full_name AS fullName,
    email,
    phone,
    password_hash AS passwordHash,
    role,
    status,
    created_at AS createdAt
  FROM users
`;

function mapUser(row: UserRow): AuthUser {
  return {
    id: Number(row.id),
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt,
  };
}

export interface UserWithPassword {
  user: AuthUser;
  passwordHash: string;
}

export async function findUserForLogin(email: string): Promise<UserWithPassword | null> {
  try {
    const pool = getPool();
    const [rows] = await pool.query<UserRow[]>(`${USER_SELECT} WHERE email = ? LIMIT 1`, [email]);
    const row = rows[0];
    if (!row) return null;
    return { user: mapUser(row), passwordHash: row.passwordHash };
  } catch (error) {
    console.warn("Database unavailable during findUserForLogin:", error);
    return null;
  }
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  try {
    const pool = getPool();
    const [rows] = await pool.query<UserRow[]>(`${USER_SELECT} WHERE email = ? LIMIT 1`, [email]);
    return rows[0] ? mapUser(rows[0]) : null;
  } catch (error) {
    console.warn("Database unavailable during findUserByEmail:", error);
    return null;
  }
}

export async function findUserById(id: number): Promise<AuthUser | null> {
  try {
    const pool = getPool();
    const [rows] = await pool.query<UserRow[]>(`${USER_SELECT} WHERE id = ? LIMIT 1`, [id]);
    return rows[0] ? mapUser(rows[0]) : null;
  } catch (error) {
    console.warn("Database unavailable during findUserById:", error);
    return null;
  }
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
}

export async function createUser(input: CreateUserInput): Promise<AuthUser> {
  const pool = getPool();
  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (full_name, email, phone, password_hash, role, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [input.fullName, input.email, input.phone, input.passwordHash, input.role],
    );
    const user = await findUserById(Number(result.insertId));
    if (!user) {
      throw new ApiError(500, "ACCOUNT_READ_FAILED", "The account was created but could not be reloaded.");
    }
    return user;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ER_DUP_ENTRY"
    ) {
      throw new ApiError(409, "EMAIL_TAKEN", "An account with that email already exists.", {
        email: "An account with that email already exists.",
      });
    }
    throw error;
  }
}

export async function updateUserProfile(
  userId: number,
  input: { fullName: string; email: string; phone: string },
): Promise<AuthUser> {
  const pool = getPool();
  try {
    await pool.query(
      `UPDATE users SET full_name = ?, email = ?, phone = ? WHERE id = ?`,
      [input.fullName, input.email, input.phone, userId],
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ER_DUP_ENTRY"
    ) {
      throw new ApiError(409, "EMAIL_TAKEN", "An account with that email already exists.", {
        email: "An account with that email already exists.",
      });
    }
    throw error;
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(404, "ACCOUNT_NOT_FOUND", "That account no longer exists.");
  }
  return user;
}

export async function updateUserPasswordHash(userId: number, passwordHash: string): Promise<void> {
  const pool = getPool();
  await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, userId]);
}

export async function listCustomers(): Promise<AdminCustomerSummary[]> {
  try {
    const pool = getPool();
    const [rows] = await pool.query<CustomerRow[]>(
      `SELECT
         u.id,
         u.full_name AS fullName,
         u.email,
         u.phone,
         u.status,
         u.created_at AS createdAt,
         COUNT(b.id) AS reservationCount,
         COALESCE(SUM(
           CASE WHEN b.status IN ('pending', 'confirmed') THEN b.total ELSE 0 END
         ), 0) AS totalSpent
       FROM users u
       LEFT JOIN bookings b ON b.user_id = u.id
       WHERE u.role = 'customer'
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
    );

    return rows.map((row) => ({
      id: Number(row.id),
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      status: row.status,
      createdAt: row.createdAt,
      reservationCount: Number(row.reservationCount),
      totalSpent: Number(row.totalSpent),
    }));
  } catch (error) {
    console.warn("Database unavailable during listCustomers:", error);
    return [];
  }
}

export async function listStaff(): Promise<AdminStaffSummary[]> {
  try {
    const pool = getPool();
    const [rows] = await pool.query<UserRow[]>(
      `${USER_SELECT} WHERE role IN ('admin', 'staff') ORDER BY role ASC, created_at DESC`,
    );

    return rows.map((row) => ({
      id: Number(row.id),
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      role: row.role,
      status: row.status,
      createdAt: row.createdAt,
    }));
  } catch (error) {
    console.warn("Database unavailable during listStaff:", error);
    return [];
  }
}

export async function createStaffUser(input: Omit<CreateUserInput, "role">): Promise<AuthUser> {
  return createUser({ ...input, role: "staff" });
}

export async function updateUserStatus(userId: number, status: UserStatus): Promise<AuthUser> {
  const pool = getPool();
  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(404, "ACCOUNT_NOT_FOUND", "That account no longer exists.");
  }
  await pool.query("UPDATE users SET status = ? WHERE id = ?", [status, userId]);
  return { ...user, status };
}

/** Deletes every session for a user except the one identified by `keepTokenHash`. */
export async function deleteUserSessions(userId: number, keepTokenHash?: string): Promise<void> {
  try {
    const pool = getPool();
    if (keepTokenHash) {
      await pool.query("DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?", [
        userId,
        keepTokenHash,
      ]);
    } else {
      await pool.query("DELETE FROM sessions WHERE user_id = ?", [userId]);
    }
  } catch (error) {
    console.warn("Database unavailable during deleteUserSessions:", error);
  }
}