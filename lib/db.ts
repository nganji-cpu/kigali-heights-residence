import "server-only";
import mysql, { type Pool } from "mysql2/promise";

/**
 * MySQL connection pool.
 *
 * The pool is cached on `globalThis` so Next.js hot reloads do not open a new
 * pool on every request. This module is server-only: it must never be imported
 * by a Client Component, and the credentials are read from server environment
 * variables only.
 */
const globalForDb = globalThis as typeof globalThis & {
  __khrMysqlPool?: Pool;
};

const DEFAULT_DATABASE = "kigali_heights_residence";

export function getPool(): Pool {
  if (!globalForDb.__khrMysqlPool) {
    globalForDb.__khrMysqlPool = mysql.createPool({
      host: process.env.DB_HOST ?? "127.0.0.1",
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? "root",
      password: process.env.DB_PASSWORD ?? "",
      database: process.env.DB_NAME ?? DEFAULT_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: "utf8mb4",
      // DATE columns become "YYYY-MM-DD" strings and DECIMAL columns become
      // numbers, which is exactly the shape the frontend already expects.
      dateStrings: true,
      decimalNumbers: true,
    });
  }

  return globalForDb.__khrMysqlPool;
}

export const databaseName = process.env.DB_NAME ?? DEFAULT_DATABASE;
