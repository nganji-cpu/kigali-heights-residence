/**
 * Create or promote the first administrator account.
 *
 * No administrator credentials are hard-coded. Supply the details through
 * environment variables (recommended, so the password is not kept in shell
 * history) or one-off arguments:
 *
 *   $env:ADMIN_NAME="Hotel Manager"
 *   $env:ADMIN_EMAIL="manager@example.com"
 *   $env:ADMIN_PHONE="+250 788 000 000"
 *   $env:ADMIN_PASSWORD="a-long-unique-password"
 *   npm run admin:create
 *
 * If no password is supplied, a strong temporary one is generated and printed
 * once. Change it after signing in from the customer profile page.
 *
 * Usage:
 *   npm run admin:create
 *   npm run admin:create -- --email manager@example.com --name "Hotel Manager" --phone "+250..." --password "..."
 */
import { randomBytes } from "node:crypto";
import { loadEnvFile } from "node:process";
import path from "node:path";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const root = path.resolve(import.meta.dirname, "..");

for (const file of [".env.local", ".env"]) {
  try {
    loadEnvFile(path.join(root, file));
    break;
  } catch {
    // Defaults below are used.
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

function readArg(name) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((value) => value.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
  return "";
}

const name = (process.env.ADMIN_NAME ?? readArg("name") ?? "").trim();
const email = (process.env.ADMIN_EMAIL ?? readArg("email") ?? "").trim().toLowerCase();
const phone = (process.env.ADMIN_PHONE ?? readArg("phone") ?? "").trim();
let password = process.env.ADMIN_PASSWORD ?? readArg("password") ?? "";
let generatedPassword = false;

const errors = [];
if (name.length < 2 || name.length > 120) errors.push("ADMIN_NAME must be 2–120 characters.");
if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) || email.length > 190) {
  errors.push("ADMIN_EMAIL must be a valid email address.");
}
if (phone.length < 6 || phone.length > 40) errors.push("ADMIN_PHONE must be 6–40 characters.");
if (password && password.length < 10) errors.push("ADMIN_PASSWORD must be at least 10 characters.");

if (errors.length > 0) {
  console.error("Cannot create the administrator:\n");
  for (const error of errors) console.error(`- ${error}`);
  console.error(
    "\nExample:\n  $env:ADMIN_NAME=\"Hotel Manager\"\n  $env:ADMIN_EMAIL=\"manager@example.com\"\n  $env:ADMIN_PHONE=\"+250 788 000 000\"\n  $env:ADMIN_PASSWORD=\"a-long-unique-password\"\n  npm run admin:create\n",
  );
  process.exit(1);
}

if (!password) {
  password = `Khr-${randomBytes(15).toString("base64url")}!7`;
  generatedPassword = true;
}

let connection;
try {
  connection = await mysql.createConnection(config);

  const [existing] = await connection.query(
    "SELECT id, role FROM users WHERE email = ? LIMIT 1",
    [email],
  );

  if (existing.length > 0) {
    const user = existing[0];
    if (generatedPassword) {
      await connection.query(
        `UPDATE users
            SET full_name = ?, phone = ?, role = 'admin', status = 'active'
          WHERE id = ?`,
        [name, phone, user.id],
      );
      console.log(
        `Existing account ${email} was promoted to admin. Its password was left unchanged.`,
      );
    } else {
      const hash = await bcrypt.hash(password, 12);
      await connection.query(
        `UPDATE users
            SET full_name = ?, phone = ?, password_hash = ?, role = 'admin', status = 'active'
          WHERE id = ?`,
        [name, phone, hash, user.id],
      );
      console.log(`Existing account ${email} was promoted to admin and its password was reset.`);
    }
  } else {
    const hash = await bcrypt.hash(password, 12);
    await connection.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'admin', 'active')`,
      [name, email, phone, hash],
    );
    console.log(`Administrator ${email} created.`);
  }

  if (generatedPassword) {
    console.log("\nTemporary password (shown once):");
    console.log(`  ${password}`);
    console.log("\nSign in at /login and change it from the account profile page.");
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nCould not create the administrator:\n${message}\n`);
  process.exitCode = 1;
} finally {
  await connection?.end();
}
