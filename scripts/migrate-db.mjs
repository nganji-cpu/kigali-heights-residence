/**
 * Incremental, idempotent database migration runner.
 *
 * It first applies database/schema.sql, which creates any missing tables and
 * upserts reference data without deleting rows. It then adds the columns,
 * indexes and constraints that CREATE TABLE IF NOT EXISTS cannot add to an
 * existing installation.
 *
 * The runner checks information_schema before every change, so it is safe to
 * run more than once and will not reset or delete existing records.
 *
 * Usage:
 *   npm run db:migrate
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvFile } from "node:process";
import mysql from "mysql2/promise";

const root = path.resolve(import.meta.dirname, "..");

for (const file of [".env.local", ".env"]) {
  try {
    loadEnvFile(path.join(root, file));
    break;
  } catch {
    // Fall back to the defaults below.
  }
}

const config = {
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "kigali_heights_residence",
  charset: "utf8mb4",
};

const dbName = config.database;
const schemaPath = path.join(root, "database", "schema.sql");

async function hasColumn(connection, table, column) {
  const [rows] = await connection.query(
    `SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
      LIMIT 1`,
    [dbName, table, column],
  );
  return rows.length > 0;
}

async function columnType(connection, table, column) {
  const [rows] = await connection.query(
    `SELECT COLUMN_TYPE AS columnType FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
      LIMIT 1`,
    [dbName, table, column],
  );
  return rows[0]?.columnType ?? null;
}

async function hasIndex(connection, table, index) {
  const [rows] = await connection.query(
    `SELECT 1 FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?
      LIMIT 1`,
    [dbName, table, index],
  );
  return rows.length > 0;
}

async function hasConstraint(connection, table, constraint) {
  const [rows] = await connection.query(
    `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?
      LIMIT 1`,
    [dbName, table, constraint],
  );
  return rows.length > 0;
}

let connection;
try {
  console.log(
    "Before applying this migration, take a database backup, for example:\n" +
      `  mysqldump -u ${config.user} -p ${dbName} > backup_before_migration.sql\n`,
  );

  connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true,
    charset: "utf8mb4",
  });

  console.log(`Applying base schema to "${dbName}" ...`);
  const schema = await readFile(schemaPath, "utf8");
  await connection.query(schema);
  await connection.changeUser({ database: dbName });

  // -------------------------------------------------------------------------
  // rooms.status
  // -------------------------------------------------------------------------
  if (!(await hasColumn(connection, "rooms", "status"))) {
    console.log("Adding rooms.status ...");
    await connection.query(
      `ALTER TABLE rooms
         ADD COLUMN status ENUM('available', 'occupied', 'maintenance', 'inactive')
           NOT NULL DEFAULT 'available' AFTER featured`,
    );
  }
  if (!(await hasIndex(connection, "rooms", "idx_rooms_status"))) {
    console.log("Adding index idx_rooms_status ...");
    await connection.query("ALTER TABLE rooms ADD KEY idx_rooms_status (status)");
  }

  // -------------------------------------------------------------------------
  // bookings.user_id + lifecycle columns
  // -------------------------------------------------------------------------
  if (!(await hasColumn(connection, "bookings", "user_id"))) {
    console.log("Adding bookings.user_id ...");
    await connection.query(
      "ALTER TABLE bookings ADD COLUMN user_id INT UNSIGNED NULL AFTER reference",
    );
  }
  if (!(await hasColumn(connection, "bookings", "confirmed_at"))) {
    console.log("Adding bookings.confirmed_at ...");
    await connection.query(
      "ALTER TABLE bookings ADD COLUMN confirmed_at DATETIME NULL AFTER status",
    );
  }
  if (!(await hasColumn(connection, "bookings", "cancelled_at"))) {
    console.log("Adding bookings.cancelled_at ...");
    await connection.query(
      "ALTER TABLE bookings ADD COLUMN cancelled_at DATETIME NULL AFTER confirmed_at",
    );
  }
  if (!(await hasColumn(connection, "bookings", "access_token_hash"))) {
    console.log("Adding bookings.access_token_hash ...");
    await connection.query(
      "ALTER TABLE bookings ADD COLUMN access_token_hash CHAR(64) NULL AFTER cancelled_at",
    );
  }
  if (!(await hasIndex(connection, "bookings", "idx_bookings_user"))) {
    console.log("Adding index idx_bookings_user ...");
    await connection.query(
      "ALTER TABLE bookings ADD KEY idx_bookings_user (user_id, created_at)",
    );
  }
  if (!(await hasIndex(connection, "bookings", "idx_bookings_token_hash"))) {
    console.log("Adding index idx_bookings_token_hash ...");
    await connection.query(
      "ALTER TABLE bookings ADD KEY idx_bookings_token_hash (access_token_hash)",
    );
  }
  if (!(await hasConstraint(connection, "bookings", "fk_bookings_user"))) {
    console.log("Adding foreign key fk_bookings_user ...");
    await connection.query(
      `ALTER TABLE bookings
         ADD CONSTRAINT fk_bookings_user
         FOREIGN KEY (user_id) REFERENCES users (id)
         ON UPDATE CASCADE ON DELETE SET NULL`,
    );
  }

  const statusType = await columnType(connection, "bookings", "status");
  if (!statusType || !statusType.includes("pending")) {
    console.log("Extending bookings.status with draft/pending ...");
    await connection.query(
      `ALTER TABLE bookings
         MODIFY COLUMN status ENUM('draft', 'pending', 'confirmed', 'cancelled')
         NOT NULL DEFAULT 'pending'`,
    );
  }

  // -------------------------------------------------------------------------
  // contact_messages status & timestamps
  // -------------------------------------------------------------------------
  if (!(await hasColumn(connection, "contact_messages", "status"))) {
    console.log("Adding contact_messages.status ...");
    await connection.query(
      `ALTER TABLE contact_messages
         ADD COLUMN status ENUM('unread', 'read', 'handled', 'archived')
           NOT NULL DEFAULT 'unread' AFTER message`,
    );
  }
  if (!(await hasColumn(connection, "contact_messages", "read_at"))) {
    console.log("Adding contact_messages.read_at ...");
    await connection.query(
      "ALTER TABLE contact_messages ADD COLUMN read_at DATETIME NULL AFTER status",
    );
  }
  if (!(await hasColumn(connection, "contact_messages", "handled_at"))) {
    console.log("Adding contact_messages.handled_at ...");
    await connection.query(
      "ALTER TABLE contact_messages ADD COLUMN handled_at DATETIME NULL AFTER read_at",
    );
  }
  if (!(await hasColumn(connection, "contact_messages", "archived_at"))) {
    console.log("Adding contact_messages.archived_at ...");
    await connection.query(
      "ALTER TABLE contact_messages ADD COLUMN archived_at DATETIME NULL AFTER handled_at",
    );
  }
  if (!(await hasIndex(connection, "contact_messages", "idx_contact_messages_status"))) {
    console.log("Adding index idx_contact_messages_status ...");
    await connection.query(
      "ALTER TABLE contact_messages ADD KEY idx_contact_messages_status (status)",
    );
  }

  // -------------------------------------------------------------------------
  // booking_services notes & updated_at
  // -------------------------------------------------------------------------
  if (!(await hasColumn(connection, "booking_services", "notes"))) {
    console.log("Adding booking_services.notes ...");
    await connection.query(
      "ALTER TABLE booking_services ADD COLUMN notes TEXT NULL AFTER status",
    );
  }
  if (!(await hasColumn(connection, "booking_services", "updated_at"))) {
    console.log("Adding booking_services.updated_at ...");
    await connection.query(
      "ALTER TABLE booking_services ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at",
    );
  }

  const [counts] = await connection.query(
    `SELECT
       (SELECT COUNT(*) FROM users) AS users,
       (SELECT COUNT(*) FROM sessions) AS sessions,
       (SELECT COUNT(*) FROM reservation_drafts) AS drafts,
       (SELECT COUNT(*) FROM bookings) AS bookings,
       (SELECT COUNT(*) FROM payments) AS payments,
       (SELECT COUNT(*) FROM contact_messages) AS messages,
       (SELECT COUNT(*) FROM admin_activity_logs) AS logs,
       (SELECT COUNT(*) FROM admin_notes) AS notes,
       (SELECT COUNT(*) FROM admin_replies) AS replies`,
  );

  console.log("\nMigration complete. Existing records were preserved.");
  console.log(
    [
      `Users: ${counts[0].users}`,
      `Sessions: ${counts[0].sessions}`,
      `Reservation drafts: ${counts[0].drafts}`,
      `Bookings: ${counts[0].bookings}`,
      `Payments: ${counts[0].payments}`,
      `Contact messages: ${counts[0].messages}`,
      `Admin logs: ${counts[0].logs}`,
      `Admin notes: ${counts[0].notes}`,
      `Admin replies: ${counts[0].replies}`,
    ].join("\n"),
  );
  console.log(
    "\nCreate the first administrator with:\n  npm run admin:create\n",
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nMigration failed:\n${message}\n`);
  console.error(
    "No records were deleted. Restore your backup if a partial change needs to be undone.",
  );
  process.exitCode = 1;
} finally {
  await connection?.end();
}
