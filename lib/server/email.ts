import "server-only";
import { randomBytes } from "node:crypto";
import { createConnection, type Socket } from "node:net";
import { hostname } from "node:os";
import { connect as connectTls, type TLSSocket } from "node:tls";

/**
 * Minimal, dependency-free SMTP client.
 *
 * We deliberately do not report a message as delivered unless the SMTP server
 * accepted it. When SMTP_HOST / EMAIL_FROM are not configured the send is
 * skipped and logged, and the calling workflow continues normally.
 *
 * Supported configuration:
 *   SMTP_HOST, SMTP_PORT (default 587), SMTP_SECURE (true for implicit TLS / 465),
 *   SMTP_USER, SMTP_PASSWORD, EMAIL_FROM, EMAIL_FROM_NAME,
 *   ADMIN_NOTIFICATION_EMAIL, SMTP_TIMEOUT_MS,
 *   SMTP_TLS_REJECT_UNAUTHORIZED (set to "false" only for a local test server)
 */

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_TIMEOUT_MS = 60_000;
const SMTP_EHLO_NAME = (hostname() || "localhost").replace(/[^a-zA-Z0-9.-]/g, "") || "localhost";

interface Mailbox {
  name: string;
  address: string;
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: Mailbox;
  adminAddress: string;
  timeoutMs: number;
  rejectUnauthorized: boolean;
}

export interface EmailMessage {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export type EmailSendResult =
  | { ok: true }
  | { ok: false; skipped: true; error: "not_configured" }
  | { ok: false; skipped: false; error: string };

function parseMailbox(value: string, fallbackName = ""): Mailbox | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const angled = /^(?:"?([^"<]*)"?)?\s*<([^<>]+)>$/.exec(trimmed);
  if (angled) {
    const address = angled[2].trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return null;
    return { name: (angled[1] ?? fallbackName).trim(), address };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return { name: fallbackName.trim(), address: trimmed };
}

function readConfig(): EmailConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const fromValue = process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER?.trim() || "";
  const from = parseMailbox(fromValue, process.env.EMAIL_FROM_NAME ?? "Kigali Heights Residence");

  if (!host || !from) return null;

  const rawPort = Number(process.env.SMTP_PORT ?? 587);
  const port = Number.isFinite(rawPort) && rawPort > 0 && rawPort < 65536 ? rawPort : 587;
  const secure =
    (process.env.SMTP_SECURE ?? "").toLowerCase() === "true" || port === 465;
  const timeout = Number(process.env.SMTP_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);

  const admin = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
  const adminMailbox = admin ? parseMailbox(admin) : null;

  return {
    host,
    port,
    secure,
    user: process.env.SMTP_USER?.trim() ?? "",
    password: process.env.SMTP_PASSWORD ?? "",
    from,
    adminAddress: adminMailbox?.address ?? from.address,
    timeoutMs:
      Number.isFinite(timeout) && timeout >= 1_000
        ? Math.min(timeout, MAX_TIMEOUT_MS)
        : DEFAULT_TIMEOUT_MS,
    rejectUnauthorized:
      (process.env.SMTP_TLS_REJECT_UNAUTHORIZED ?? "").toLowerCase() !== "false",
  };
}

/** Safe, secret-free status for the admin settings screen. */
export function getEmailConfigStatus(): {
  configured: boolean;
  host: string | null;
  port: number | null;
  secure: boolean | null;
  from: string | null;
  adminNotification: string | null;
} {
  const config = readConfig();
  if (!config) {
    return {
      configured: false,
      host: null,
      port: null,
      secure: null,
      from: null,
      adminNotification: null,
    };
  }
  return {
    configured: true,
    host: config.host,
    port: config.port,
    secure: config.secure,
    from: config.from.address,
    adminNotification: config.adminAddress,
  };
}

export function isEmailConfigured(): boolean {
  return readConfig() !== null;
}

function escapeHeader(value: string): string {
  if (/[\r\n]/.test(value)) {
    throw new Error("Email header contains a line break.");
  }
  return value.replace(/\s+/g, " ").trim();
}

function encodeSubject(value: string): string {
  const safe = escapeHeader(value);
  return /^[\x20-\x7E]*$/.test(safe)
    ? safe
    : `=?UTF-8?B?${Buffer.from(safe, "utf8").toString("base64")}?=`;
}

function formatFrom(mailbox: Mailbox): string {
  const name = escapeHeader(mailbox.name);
  if (!name) return mailbox.address;
  if (/^[\x20-\x7E]*$/.test(name) && !/[",<>]/.test(name)) {
    return `${name} <${mailbox.address}>`;
  }
  return `=?UTF-8?B?${Buffer.from(name, "utf8").toString("base64")}?= <${mailbox.address}>`;
}

function base64Body(value: string): string {
  const chunks = Buffer.from(value, "utf8").toString("base64").match(/.{1,76}/g);
  return chunks ? chunks.join("\r\n") : "";
}

function dotStuff(value: string): string {
  return value.replace(/\r?\n/g, "\r\n").replace(/(^|\r\n)\./g, "$1..");
}

function normaliseRecipients(to: string | string[]): string[] {
  const values = Array.isArray(to) ? to : [to];
  const recipients: string[] = [];
  for (const value of values) {
    const mailbox = parseMailbox(escapeHeader(value));
    if (mailbox) recipients.push(mailbox.address);
  }
  return Array.from(new Set(recipients));
}

function maskEmail(value: string): string {
  const [local, domain] = value.split("@");
  if (!domain) return "***";
  const visible = local?.slice(0, 2) ?? "";
  return `${visible}***@${domain}`;
}

function buildMimeMessage(config: EmailConfig, message: EmailMessage, recipients: string[]): string {
  const boundary = `----khr-${randomBytes(12).toString("hex")}`;
  const messageIdDomain = config.from.address.split("@")[1] ?? "kigaliheights.local";
  const headers = [
    `From: ${formatFrom(config.from)}`,
    `To: ${recipients.join(", ")}`,
    `Subject: ${encodeSubject(message.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${randomBytes(16).toString("hex")}@${messageIdDomain}>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];

  if (message.replyTo) {
    const replyTo = parseMailbox(escapeHeader(message.replyTo));
    if (replyTo) headers.push(`Reply-To: ${formatFrom(replyTo)}`);
  }

  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    base64Body(message.text),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    base64Body(message.html),
    `--${boundary}--`,
  ].join("\r\n");

  return `${headers.join("\r\n")}\r\n\r\n${dotStuff(body)}`;
}

interface SmtpResponse {
  code: number;
  lines: string[];
}

type AnySocket = Socket | TLSSocket;

class SmtpClient {
  private socket: AnySocket;
  private buffer = "";
  private responseLines: string[] = [];
  private waiter: {
    resolve: (response: SmtpResponse) => void;
    reject: (error: Error) => void;
  } | null = null;
  private failure: Error | null = null;
  private readonly config: EmailConfig;

  private readonly onData = (chunk: Buffer) => {
    this.buffer += chunk.toString("utf8");
    this.flush();
  };

  private readonly onError = (error: Error) => {
    this.failure = error;
    this.rejectWaiter(error);
  };

  private readonly onClose = () => {
    if (this.waiter) {
      this.rejectWaiter(new Error("SMTP connection closed unexpectedly."));
    }
  };

  private readonly onTimeout = () => {
    const error = new Error("SMTP connection timed out.");
    this.failure = error;
    this.rejectWaiter(error);
    this.socket.destroy();
  };

  constructor(socket: AnySocket, config: EmailConfig) {
    this.socket = socket;
    this.config = config;
    this.attach(socket);
  }

  private attach(socket: AnySocket): void {
    socket.on("data", this.onData);
    socket.on("error", this.onError);
    socket.on("close", this.onClose);
    socket.on("timeout", this.onTimeout);
    socket.setTimeout(this.config.timeoutMs);
  }

  private detach(socket: AnySocket): void {
    socket.off("data", this.onData);
    socket.off("error", this.onError);
    socket.off("close", this.onClose);
    socket.off("timeout", this.onTimeout);
  }

  private rejectWaiter(error: Error): void {
    const waiter = this.waiter;
    this.waiter = null;
    waiter?.reject(error);
  }

  private flush(): void {
    if (!this.waiter) return;
    let index = this.buffer.indexOf("\r\n");
    while (index !== -1) {
      const line = this.buffer.slice(0, index);
      this.buffer = this.buffer.slice(index + 2);
      this.responseLines.push(line);

      // A line with "250 " (space, not hyphen) terminates a multiline reply.
      if (/^\d{3} /.test(line)) {
        const response = {
          code: Number(line.slice(0, 3)),
          lines: this.responseLines,
        };
        this.responseLines = [];
        const waiter = this.waiter;
        this.waiter = null;
        waiter?.resolve(response);
        return;
      }
      index = this.buffer.indexOf("\r\n");
    }
  }

  readResponse(): Promise<SmtpResponse> {
    if (this.failure) return Promise.reject(this.failure);
    return new Promise<SmtpResponse>((resolve, reject) => {
      this.waiter = { resolve, reject };
      this.flush();
    });
  }

  async command(line: string, expected: number[]): Promise<SmtpResponse> {
    this.socket.write(`${line}\r\n`);
    const response = await this.readResponse();
    if (!expected.includes(response.code)) {
      throw new Error(
        `SMTP command failed with ${response.code}: ${response.lines.join(" | ")}`,
      );
    }
    return response;
  }

  async writeData(payload: string): Promise<void> {
    this.socket.write(`${payload}\r\n.\r\n`);
    const response = await this.readResponse();
    if (response.code !== 250) {
      throw new Error(`SMTP DATA failed with ${response.code}: ${response.lines.join(" | ")}`);
    }
  }

  async upgradeToTls(): Promise<void> {
    const plainSocket = this.socket as Socket;
    this.detach(plainSocket);
    this.buffer = "";
    this.responseLines = [];
    this.failure = null;

    const secureSocket = connectTls({
      socket: plainSocket,
      servername: this.config.host,
      rejectUnauthorized: this.config.rejectUnauthorized,
    });

    this.socket = secureSocket;
    this.attach(secureSocket);

    await new Promise<void>((resolve, reject) => {
      secureSocket.once("secureConnect", resolve);
      secureSocket.once("error", reject);
    });
  }

  close(): void {
    try {
      this.socket.write("QUIT\r\n");
    } catch {
      // The server may already have closed the connection.
    }
    try {
      this.socket.end();
    } catch {
      // Ignore shutdown errors; the message has already been accepted or not.
    }
    this.detach(this.socket);
    this.socket.destroy();
  }
}

async function openSocket(config: EmailConfig): Promise<SmtpClient> {
  const socket: AnySocket = config.secure
    ? connectTls({
        host: config.host,
        port: config.port,
        servername: config.host,
        rejectUnauthorized: config.rejectUnauthorized,
      })
    : createConnection({ host: config.host, port: config.port });

  await new Promise<void>((resolve, reject) => {
    socket.once(config.secure ? "secureConnect" : "connect", resolve);
    socket.once("error", reject);
  });

  return new SmtpClient(socket, config);
}

function authMechanisms(response: SmtpResponse): Set<string> {
  const mechanisms = new Set<string>();
  for (const line of response.lines) {
    if (!/^\d{3}[- ]AUTH[ =]/i.test(line)) continue;
    const value = line.replace(/^\d{3}[- ]AUTH[ =]\s*/i, "").trim().toUpperCase();
    for (const mechanism of value.split(/\s+/)) {
      if (mechanism) mechanisms.add(mechanism);
    }
  }
  return mechanisms;
}

async function deliver(config: EmailConfig, message: EmailMessage): Promise<void> {
  const recipients = normaliseRecipients(message.to);
  if (recipients.length === 0) {
    throw new Error("No valid recipient address was supplied.");
  }

  const client = await openSocket(config);
  try {
    const greeting = await client.readResponse();
    if (greeting.code !== 220) {
      throw new Error(`SMTP server rejected the connection (${greeting.code}).`);
    }

    let ehlo = await client.command(`EHLO ${SMTP_EHLO_NAME}`, [250]);
    const supportsStartTls = ehlo.lines.some((line) => /^\d{3}[- ]STARTTLS\b/i.test(line));

    if (!config.secure && supportsStartTls) {
      await client.command("STARTTLS", [220]);
      await client.upgradeToTls();
      ehlo = await client.command(`EHLO ${SMTP_EHLO_NAME}`, [250]);
    }

    if (config.user) {
      if (!config.password) {
        throw new Error("SMTP_USER is set but SMTP_PASSWORD is empty.");
      }
      const mechanisms = authMechanisms(ehlo);
      if (mechanisms.has("PLAIN") || mechanisms.size === 0) {
        const payload = Buffer.from(`\0${config.user}\0${config.password}`, "utf8").toString(
          "base64",
        );
        await client.command(`AUTH PLAIN ${payload}`, [235]);
      } else if (mechanisms.has("LOGIN")) {
        await client.command("AUTH LOGIN", [334]);
        await client.command(Buffer.from(config.user, "utf8").toString("base64"), [334]);
        await client.command(Buffer.from(config.password, "utf8").toString("base64"), [235]);
      } else {
        throw new Error(
          `The SMTP server does not offer a supported AUTH mechanism (${Array.from(mechanisms).join(", ")}).`,
        );
      }
    }

    await client.command(`MAIL FROM:<${config.from.address}>`, [250]);
    for (const recipient of recipients) {
      await client.command(`RCPT TO:<${recipient}>`, [250, 251]);
    }

    await client.command("DATA", [354]);
    await client.writeData(buildMimeMessage(config, message, recipients));
  } finally {
    client.close();
  }
}

/**
 * Sends one email. Never throws: the caller can continue an account or booking
 * workflow even when SMTP is unavailable, and the failure is logged without
 * exposing credentials or message bodies.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  const config = readConfig();
  if (!config) {
    console.warn(
      `[email] SMTP is not configured; skipped "${message.subject}" to ${maskEmail(
        normaliseRecipients(message.to)[0] ?? "unknown",
      )}.`,
    );
    return { ok: false, skipped: true, error: "not_configured" };
  }

  try {
    await deliver(config, message);
    return { ok: true };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown SMTP error.";
    console.warn(
      `[email] Delivery failed for "${message.subject}": ${reason}`,
    );
    return { ok: false, skipped: false, error: reason };
  }
}
