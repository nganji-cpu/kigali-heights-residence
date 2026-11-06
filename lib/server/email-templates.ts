import { formatDateLong } from "@/lib/utils";

/**
 * Branded transactional email templates.
 *
 * Every template returns both a plain-text body and a table-based HTML body so
 * the message is readable in clients that block HTML. Values that originate
 * from a guest or an administrator are HTML-escaped.
 */

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

export interface BookingEmailDetails {
  reference: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  total: number;
  status?: string;
  requests?: string;
}

export interface PaymentEmailDetails {
  reference: string;
  guestName: string;
  roomName: string;
  amount: number;
  method: string;
  status: string;
  transactionReference?: string;
  paidAt?: string | null;
}

const BRAND = {
  ink: "#1f1d1a",
  charcoal: "#3b3732",
  bronze: "#9a6b3f",
  ivory: "#f7f3ec",
  canvas: "#fbf8f3",
  stone: "#ded6c9",
  muted: "#6f675d",
  sage: "#4f6b58",
};

const SITE_NAME = "Kigali Heights Residence";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function nightsLabel(nights: number): string {
  return `${nights} ${nights === 1 ? "night" : "nights"}`;
}

function guestsLabel(guests: number): string {
  return `${guests} ${guests === 1 ? "guest" : "guests"}`;
}

function statusLabel(status?: string): string {
  switch (status) {
    case "pending":
      return "Awaiting confirmation";
    case "confirmed":
      return "Confirmed";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "refunded":
      return "Refunded";
    default:
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Updated";
  }
}

function dateTimeLabel(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface LayoutOptions {
  title: string;
  preheader: string;
  intro: string;
  bodyHtml: string;
  cta?: { label: string; url: string };
  footnote?: string;
}

function layout({ title, preheader, intro, bodyHtml, cta, footnote }: LayoutOptions): string {
  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px">
         <tr>
           <td style="background:${BRAND.ink};padding:14px 26px">
             <a href="${escapeHtml(cta.url)}" style="color:${BRAND.ivory};font-family:Georgia,'Times New Roman',serif;font-size:15px;text-decoration:none;letter-spacing:0.02em">${escapeHtml(cta.label)}</a>
           </td>
         </tr>
       </table>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.canvas};color:${BRAND.charcoal};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.canvas};padding:28px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid ${BRAND.stone}">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid ${BRAND.stone};background:${BRAND.ink}">
                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:0.08em;color:${BRAND.ivory};text-transform:uppercase">Kigali Heights</p>
                <p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.22em;color:${BRAND.stone};text-transform:uppercase">Residence · Kigali</p>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 12px">
                <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.18em;color:${BRAND.bronze};text-transform:uppercase">${escapeHtml(preheader)}</p>
                <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;font-weight:normal;color:${BRAND.ink}">${escapeHtml(title)}</h1>
                <p style="margin:18px 0 0;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:${BRAND.charcoal}">${escapeHtml(intro)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 28px;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.charcoal}">
                ${bodyHtml}
                ${ctaHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 32px;border-top:1px solid ${BRAND.stone};background:${BRAND.ivory};font-family:Arial,sans-serif;font-size:11px;line-height:1.6;color:${BRAND.muted}">
                ${footnote ? `<p style="margin:0 0 8px">${escapeHtml(footnote)}</p>` : ""}
                <p style="margin:0">${SITE_NAME} · Kigali, Rwanda</p>
                <p style="margin:4px 0 0">This is an automated message. Please reply to this email if you need help.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function detailsTable(rows: Array<{ label: string; value: string }>): string {
  const cells = rows
    .map(
      (row) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid ${BRAND.stone};font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.06em;color:${BRAND.muted};text-transform:uppercase;width:42%">${escapeHtml(row.label)}</td>
        <td style="padding:8px 0;border-bottom:1px solid ${BRAND.stone};font-family:Arial,sans-serif;font-size:14px;color:${BRAND.ink}">${escapeHtml(row.value)}</td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px">${cells}</table>`;
}

function textDetails(rows: Array<{ label: string; value: string }>): string {
  return rows.map((row) => `${row.label}: ${row.value}`).join("\n");
}

/* ------------------------------------------------------------------------- */
/* Account emails                                                            */
/* ------------------------------------------------------------------------- */

export function welcomeTemplate(input: {
  fullName: string;
  email: string;
  dashboardUrl: string;
}): EmailTemplate {
  const intro = `Welcome, ${input.fullName}. Your Kigali Heights Residence account is ready.`;
  const body = `<p style="margin:0 0 12px">You can now hold a reservation, save an unfinished booking and review the details of every stay from your account.</p>
    <p style="margin:0 0 12px">Your sign-in email is <strong>${escapeHtml(input.email)}</strong>.</p>
    <p style="margin:0">If you did not create this account, please contact the residence team immediately.</p>`;

  return {
    subject: "Welcome to Kigali Heights Residence",
    text: [
      intro,
      "",
      "You can now hold a reservation, save an unfinished booking and review the details of every stay from your account.",
      `Sign-in email: ${input.email}`,
      "",
      `Open your account: ${input.dashboardUrl}`,
      "",
      "If you did not create this account, please contact the residence team immediately.",
      "",
      SITE_NAME,
    ].join("\n"),
    html: layout({
      title: "Welcome to the residence.",
      preheader: "Your account is ready",
      intro,
      bodyHtml: body,
      cta: { label: "Open my account", url: input.dashboardUrl },
      footnote: "Keep your password private. The residence team will never ask you for it by email.",
    }),
  };
}

export function passwordResetTemplate(input: {
  fullName: string;
  resetUrl: string;
  expiresInMinutes: number;
  isAdminPortal: boolean;
}): EmailTemplate {
  const intro = `Hello ${input.fullName}, we received a request to reset the password for your ${
    input.isAdminPortal ? "operations portal" : "residence"
  } account.`;
  const body = `<p style="margin:0 0 12px">This link can be used once and expires in <strong>${input.expiresInMinutes} minutes</strong>.</p>
    <p style="margin:0 0 12px">If you did not request a password reset, you can ignore this message. Your current password will stay the same.</p>
    <p style="margin:0;font-size:12px;color:${BRAND.muted};word-break:break-all">If the button does not work, copy this address into your browser:<br />${escapeHtml(input.resetUrl)}</p>`;

  return {
    subject: "Reset your Kigali Heights password",
    text: [
      intro,
      "",
      `Reset link (single use, expires in ${input.expiresInMinutes} minutes):`,
      input.resetUrl,
      "",
      "If you did not request a password reset, you can ignore this message. Your current password will stay the same.",
      "",
      SITE_NAME,
    ].join("\n"),
    html: layout({
      title: "Choose a new password.",
      preheader: "Password reset requested",
      intro,
      bodyHtml: body,
      cta: { label: "Reset my password", url: input.resetUrl },
      footnote: "For your security, this link stops working after it is used or when it expires.",
    }),
  };
}

export function passwordChangedTemplate(input: {
  fullName: string;
  isAdminPortal: boolean;
  signInUrl: string;
}): EmailTemplate {
  const intro = `Hello ${input.fullName}, the password for your ${
    input.isAdminPortal ? "operations portal" : "residence"
  } account was changed.`;
  const body = `<p style="margin:0 0 12px">Every other signed-in session has been signed out. You can sign in again with your new password.</p>
    <p style="margin:0">If you did not make this change, reset your password immediately and contact the residence team.</p>`;

  return {
    subject: "Your Kigali Heights password was changed",
    text: [
      intro,
      "",
      "Every other signed-in session has been signed out. You can sign in again with your new password.",
      "",
      `Sign in: ${input.signInUrl}`,
      "",
      "If you did not make this change, reset your password immediately and contact the residence team.",
      "",
      SITE_NAME,
    ].join("\n"),
    html: layout({
      title: "Your password was changed.",
      preheader: "Security notification",
      intro,
      bodyHtml: body,
      cta: { label: "Sign in", url: input.signInUrl },
      footnote: "This is a security notification and cannot be undone by replying.",
    }),
  };
}

/* ------------------------------------------------------------------------- */
/* Reservation and payment emails                                            */
/* ------------------------------------------------------------------------- */

export function bookingReceivedTemplate(
  input: BookingEmailDetails & { bookingUrl: string },
): EmailTemplate {
  const intro = `Thank you, ${input.guestName}. We have received your reservation request for ${input.roomName}.`;
  const rows = [
    { label: "Reference", value: input.reference },
    { label: "Apartment", value: input.roomName },
    { label: "Arrival", value: formatDateLong(input.checkIn) },
    { label: "Departure", value: formatDateLong(input.checkOut) },
    { label: "Stay", value: `${nightsLabel(input.nights)} · ${guestsLabel(input.guests)}` },
    { label: "Estimated total", value: money(input.total) },
    { label: "Status", value: "Awaiting confirmation" },
  ];
  const body = `${detailsTable(rows)}
    <p style="margin:16px 0 0">The residence team will review availability and contact you to confirm the stay. Your dates are held while the request is pending.</p>
    ${input.requests ? `<p style="margin:16px 0 0"><strong>Your requests:</strong><br />${escapeHtml(input.requests)}</p>` : ""}`;

  return {
    subject: `Reservation received · ${input.reference}`,
    text: [
      intro,
      "",
      textDetails(rows),
      "",
      "The residence team will review availability and contact you to confirm the stay. Your dates are held while the request is pending.",
      input.requests ? `\nYour requests:\n${input.requests}` : "",
      "",
      `View your reservation: ${input.bookingUrl}`,
      "",
      SITE_NAME,
    ]
      .filter(Boolean)
      .join("\n"),
    html: layout({
      title: "Your reservation is with us.",
      preheader: `Reference ${input.reference}`,
      intro,
      bodyHtml: body,
      cta: { label: "View my reservation", url: input.bookingUrl },
      footnote: "No payment was taken online. The team will arrange payment with you directly.",
    }),
  };
}

export function bookingStatusTemplate(
  input: BookingEmailDetails & { bookingUrl: string; previousStatus?: string },
): EmailTemplate {
  const status = input.status ?? "pending";
  const titles: Record<string, string> = {
    confirmed: "Your stay is confirmed.",
    cancelled: "Your reservation was cancelled.",
    pending: "Your reservation is pending.",
  };
  const intros: Record<string, string> = {
    confirmed: `Good news, ${input.guestName}. The residence team has confirmed your stay in ${input.roomName}.`,
    cancelled: `Hello ${input.guestName}. Your reservation for ${input.roomName} has been cancelled and the dates are no longer held.`,
    pending: `Hello ${input.guestName}. Your reservation for ${input.roomName} is waiting for confirmation.`,
  };
  const rows = [
    { label: "Reference", value: input.reference },
    { label: "Apartment", value: input.roomName },
    { label: "Arrival", value: formatDateLong(input.checkIn) },
    { label: "Departure", value: formatDateLong(input.checkOut) },
    { label: "Status", value: statusLabel(status) },
    { label: "Estimated total", value: money(input.total) },
  ];
  const body = `${detailsTable(rows)}
    <p style="margin:16px 0 0">${
      status === "confirmed"
        ? "We look forward to welcoming you. Please reply to this email if your arrival details change."
        : status === "cancelled"
          ? "If this was not expected, reply to this email and the team will help you find alternative dates."
          : "The team will be in touch shortly to confirm the stay."
    }</p>`;

  return {
    subject: `${statusLabel(status)} · Reservation ${input.reference}`,
    text: [
      intros[status] ?? `Your reservation ${input.reference} has been updated.`,
      "",
      textDetails(rows),
      "",
      `View your reservation: ${input.bookingUrl}`,
      "",
      SITE_NAME,
    ].join("\n"),
    html: layout({
      title: titles[status] ?? "Your reservation has been updated.",
      preheader: `${statusLabel(status)} · ${input.reference}`,
      intro: intros[status] ?? `Your reservation ${input.reference} has been updated.`,
      bodyHtml: body,
      cta: { label: "View my reservation", url: input.bookingUrl },
      footnote:
        status === "cancelled"
          ? "The apartment has been released for other guests."
          : "Keep this reference handy when you contact the residence team.",
    }),
  };
}

export function paymentReceiptTemplate(
  input: PaymentEmailDetails & { bookingUrl: string; outstandingBalance?: number },
): EmailTemplate {
  const intro = `Hello ${input.guestName}, a payment has been recorded against reservation ${input.reference}.`;
  const rows = [
    { label: "Reference", value: input.reference },
    { label: "Apartment", value: input.roomName },
    { label: "Amount", value: money(input.amount) },
    { label: "Method", value: input.method.replace(/_/g, " ") },
    { label: "Status", value: statusLabel(input.status) },
    { label: "Transaction", value: input.transactionReference || "—" },
    { label: "Recorded", value: dateTimeLabel(input.paidAt) },
  ];
  const balanceLine =
    typeof input.outstandingBalance === "number"
      ? `<p style="margin:16px 0 0">Outstanding balance after this payment: <strong>${escapeHtml(
          money(Math.max(0, input.outstandingBalance)),
        )}</strong>.</p>`
      : "";
  const body = `${detailsTable(rows)}${balanceLine}
    <p style="margin:16px 0 0">This receipt confirms the payment recorded by the residence team. No card details are stored on this website.</p>`;

  return {
    subject: `Payment receipt · ${input.reference}`,
    text: [
      intro,
      "",
      textDetails(rows),
      typeof input.outstandingBalance === "number"
        ? `Outstanding balance: ${money(Math.max(0, input.outstandingBalance))}`
        : "",
      "",
      "This receipt confirms the payment recorded by the residence team. No card details are stored on this website.",
      "",
      `View your reservation: ${input.bookingUrl}`,
      "",
      SITE_NAME,
    ]
      .filter(Boolean)
      .join("\n"),
    html: layout({
      title: "Payment received.",
      preheader: `Receipt for ${input.reference}`,
      intro,
      bodyHtml: body,
      cta: { label: "View my reservation", url: input.bookingUrl },
      footnote: "Keep this receipt for your records. Contact the team if any detail looks incorrect.",
    }),
  };
}

/* ------------------------------------------------------------------------- */
/* Administrator notifications                                               */
/* ------------------------------------------------------------------------- */

export function adminNewReservationTemplate(
  input: BookingEmailDetails & { adminUrl: string },
): EmailTemplate {
  const intro = `A new reservation request was submitted by ${input.guestName}.`;
  const rows = [
    { label: "Reference", value: input.reference },
    { label: "Guest", value: input.guestName },
    { label: "Email", value: input.guestEmail },
    { label: "Phone", value: input.guestPhone ?? "—" },
    { label: "Apartment", value: input.roomName },
    { label: "Arrival", value: formatDateLong(input.checkIn) },
    { label: "Departure", value: formatDateLong(input.checkOut) },
    { label: "Stay", value: `${nightsLabel(input.nights)} · ${guestsLabel(input.guests)}` },
    { label: "Total", value: money(input.total) },
  ];
  const body = `${detailsTable(rows)}
    ${input.requests ? `<p style="margin:16px 0 0"><strong>Guest requests:</strong><br />${escapeHtml(input.requests)}</p>` : ""}
    <p style="margin:16px 0 0">Confirm or cancel the stay from the operations portal.</p>`;

  return {
    subject: `New reservation · ${input.reference} · ${input.roomName}`,
    text: [
      intro,
      "",
      textDetails(rows),
      input.requests ? `\nGuest requests:\n${input.requests}` : "",
      "",
      `Open the operations portal: ${input.adminUrl}`,
      "",
      SITE_NAME,
    ]
      .filter(Boolean)
      .join("\n"),
    html: layout({
      title: "New reservation request.",
      preheader: `${input.reference} · ${input.roomName}`,
      intro,
      bodyHtml: body,
      cta: { label: "Review in the portal", url: input.adminUrl },
      footnote: "This notification is sent to the configured operations inbox.",
    }),
  };
}

export function adminNewCustomerTemplate(input: {
  fullName: string;
  email: string;
  phone: string;
  adminUrl: string;
}): EmailTemplate {
  const intro = `A new customer account was created by ${input.fullName}.`;
  const rows = [
    { label: "Name", value: input.fullName },
    { label: "Email", value: input.email },
    { label: "Phone", value: input.phone },
  ];
  const body = `${detailsTable(rows)}
    <p style="margin:16px 0 0">The account is active. No reservation has necessarily been made yet.</p>`;

  return {
    subject: `New customer · ${input.fullName}`,
    text: [
      intro,
      "",
      textDetails(rows),
      "",
      `Open the operations portal: ${input.adminUrl}`,
      "",
      SITE_NAME,
    ].join("\n"),
    html: layout({
      title: "New customer account.",
      preheader: input.email,
      intro,
      bodyHtml: body,
      cta: { label: "Open the portal", url: input.adminUrl },
      footnote: "This notification is sent to the configured operations inbox.",
    }),
  };
}

export function adminNewMessageTemplate(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  adminUrl: string;
}): EmailTemplate {
  const intro = `A new contact message was submitted by ${input.name}.`;
  const rows = [
    { label: "Name", value: input.name },
    { label: "Email", value: input.email },
    { label: "Topic", value: input.subject },
  ];
  const body = `${detailsTable(rows)}
    <p style="margin:16px 0 0;white-space:pre-wrap">${escapeHtml(input.message)}</p>`;

  return {
    subject: `New contact message · ${input.subject}`,
    text: [
      intro,
      "",
      textDetails(rows),
      "",
      input.message,
      "",
      `Open the portal inbox: ${input.adminUrl}`,
      "",
      SITE_NAME,
    ].join("\n"),
    html: layout({
      title: "New contact message.",
      preheader: `${input.name} · ${input.subject}`,
      intro,
      bodyHtml: body,
      cta: { label: "Open the inbox", url: input.adminUrl },
      footnote: "Reply from the operations portal so the conversation is recorded.",
    }),
  };
}
