/**
 * Initialise the Kigali Heights Residence database.
 *
 * Reads database/schema.sql and executes it as one multi-statement script.
 * The schema is idempotent, so running this again will not duplicate rows.
 *
 * Usage: npm run db:init
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvFile } from "node:process";
import mysql from "mysql2/promise";

const root = path.resolve(import.meta.dirname, "..");

// Load .env.local first, then fall back to .env. Both are optional.
for (const file of [".env.local", ".env"]) {
  try {
    loadEnvFile(path.join(root, file));
    break;
  } catch {
    // No env file at this location — defaults below will be used.
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

const schemaPath = path.join(root, "database", "schema.sql");

let schema;
try {
  schema = await readFile(schemaPath, "utf8");
} catch {
  console.error(`Could not read ${schemaPath}`);
  process.exit(1);
}

let connection;
try {
  console.log(
    `Connecting to MySQL at ${config.host}:${config.port} as ${config.user} ...`,
  );
  connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true,
    charset: "utf8mb4",
  });

  await connection.query(schema);

  console.log("Schema and reference data applied.");

  const [rows] = await connection.query(
    `SELECT
       (SELECT COUNT(*) FROM rooms) AS rooms,
       (SELECT COUNT(*) FROM apartments) AS apartments,
       (SELECT COUNT(*) FROM amenities) AS amenities,
       (SELECT COUNT(*) FROM room_images) AS images,
       (SELECT COUNT(*) FROM services) AS services,
       (SELECT COUNT(*) FROM bookings) AS bookings,
       (SELECT COUNT(*) FROM contact_messages) AS messages`,
  );

  const counts = rows[0];
  console.log(
    [
      `Apartments: ${counts.apartments}`,
      `Rooms: ${counts.rooms}`,
      `Amenities: ${counts.amenities}`,
      `Room images: ${counts.images}`,
      `Services: ${counts.services}`,
      `Existing bookings: ${counts.bookings}`,
      `Contact messages: ${counts.messages}`,
    ].join("\n"),
  );
  console.log(`\nDatabase "${config.database}" is ready.`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nDatabase initialisation failed:\n${message}\n`);

  if (/ECONNREFUSED/i.test(message)) {
    console.error(
      "MySQL is not accepting connections. Start MySQL first (XAMPP Control Panel → MySQL → Start), then retry.",
    );
  } else if (/ER_ACCESS_DENIED/i.test(message)) {
    console.error(
      "Check DB_USER and DB_PASSWORD in .env.local. XAMPP's default is root with an empty password.",
    );
  }
  process.exitCode = 1;
} finally {
  await connection?.end();
}
