import "server-only";
import { after } from "next/server";
import type { AuthUser, BookingRecord, PaymentRecord } from "@/types";
import {
  getAdminNotificationAddress,
  sendEmail,
  type EmailMessage,
  type EmailSendResult,
} from "./email";
import {
  adminNewCustomerTemplate,
  adminNewMessageTemplate,
  adminNewReservationTemplate,
  bookingReceivedTemplate,
  bookingStatusTemplate,
  passwordChangedTemplate,
  passwordResetTemplate,
  paymentReceiptTemplate,
  welcomeTemplate,
} from "./email-templates";
import { listPaymentsForBooking } from "./admin";
import { getBookingByReference } from "./repository";
import type { ContactMessageInput } from "./validation";

/**
 * Notification facade.
 *
 * Every function is safe to call from a route handler: a missing SMTP
 * configuration or an unreachable mail server is logged and never blocks the
 * underlying account, reservation or payment change. `after()` is used by the
 * route handlers for non-critical messages so the HTTP response is not delayed.
 */

function siteBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://localhost:3000";
  return configured.replace(/\/+$/, "");
}

/**
 * Runs a notification after the HTTP response has been sent. Failures are
 * logged and never surface to the caller, so email can never break a booking,
 * payment or sign-up.
 */
export function runInBackground(task: () => Promise<unknown>): void {
  after(async () => {
    try {
      await task();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      console.warn(`[notifications] Background task failed: ${reason}`);
    }
  });
}

/** Sends an operational alert to the configured admin inbox. */
async function sendToAdmin(
  message: Omit<EmailMessage, "to">,
): Promise<EmailSendResult> {
  const to = getAdminNotificationAddress();
  if (!to) return { ok: false, skipped: true, error: "not_configured" };
  return sendEmail({ to, ...message });
}

export function siteUrl(path = ""): string {
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${siteBaseUrl()}${normalised}`;
}

export async function notifyWelcome(user: AuthUser): Promise<EmailSendResult> {
  return sendEmail({
    to: user.email,
    ...welcomeTemplate({
      fullName: user.fullName,
      email: user.email,
      dashboardUrl: siteUrl("/dashboard"),
    }),
  });
}

export async function notifyAdminNewCustomer(user: AuthUser): Promise<EmailSendResult> {
  return sendToAdmin({
    ...adminNewCustomerTemplate({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      adminUrl: siteUrl("/admin/clients"),
    }),
  });
}

export async function notifyPasswordReset(input: {
  user: AuthUser;
  token: string;
  portal: "customer" | "admin";
  expiresInMinutes: number;
}): Promise<EmailSendResult> {
  const resetUrl = siteUrl(
    `/reset-password?token=${encodeURIComponent(input.token)}&portal=${input.portal}`,
  );
  return sendEmail({
    to: input.user.email,
    ...passwordResetTemplate({
      fullName: input.user.fullName,
      resetUrl,
      expiresInMinutes: input.expiresInMinutes,
      isAdminPortal: input.portal === "admin",
    }),
  });
}

export async function notifyPasswordChanged(input: {
  user: AuthUser;
  portal: "customer" | "admin";
}): Promise<EmailSendResult> {
  return sendEmail({
    to: input.user.email,
    ...passwordChangedTemplate({
      fullName: input.user.fullName,
      isAdminPortal: input.portal === "admin",
      signInUrl: siteUrl(input.portal === "admin" ? "/admin/login" : "/login"),
    }),
  });
}

export async function notifyBookingReceived(booking: BookingRecord): Promise<EmailSendResult[]> {
  const guestMessage = sendEmail({
    to: booking.guest.email,
    ...bookingReceivedTemplate({
      reference: booking.reference,
      guestName: booking.guest.name,
      guestEmail: booking.guest.email,
      guestPhone: booking.guest.phone,
      roomName: booking.room.name,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      guests: booking.guests,
      total: booking.price.total,
      requests: booking.guest.requests,
      bookingUrl: siteUrl(`/dashboard/reservations/${booking.reference}`),
    }),
  });

  const adminMessage = sendToAdmin({
    ...adminNewReservationTemplate({
      reference: booking.reference,
      guestName: booking.guest.name,
      guestEmail: booking.guest.email,
      guestPhone: booking.guest.phone,
      roomName: booking.room.name,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      guests: booking.guests,
      total: booking.price.total,
      requests: booking.guest.requests,
      adminUrl: siteUrl(`/admin/reservations/${booking.reference}`),
    }),
  });

  return Promise.all([guestMessage, adminMessage]);
}

export async function notifyReservationStatus(
  reference: string,
  status: "pending" | "confirmed" | "cancelled",
): Promise<EmailSendResult | null> {
  const booking = await getBookingByReference(reference);
  if (!booking) return null;

  return sendEmail({
    to: booking.guest.email,
    ...bookingStatusTemplate({
      reference: booking.reference,
      guestName: booking.guest.name,
      guestEmail: booking.guest.email,
      guestPhone: booking.guest.phone,
      roomName: booking.room.name,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      guests: booking.guests,
      total: booking.price.total,
      status,
      requests: booking.guest.requests,
      bookingUrl: siteUrl(`/dashboard/reservations/${booking.reference}`),
    }),
  });
}

export async function notifyPaymentRecorded(
  payment: PaymentRecord,
): Promise<EmailSendResult | null> {
  if (payment.status !== "completed") return null;

  const booking = await getBookingByReference(payment.bookingReference);
  if (!booking) return null;

  const payments = await listPaymentsForBooking(payment.bookingReference);
  const paidTotal = payments
    .filter((row) => row.status === "completed")
    .reduce((sum, row) => sum + row.amount, 0);
  const outstandingBalance = Math.round((booking.price.total - paidTotal) * 100) / 100;

  return sendEmail({
    to: booking.guest.email,
    ...paymentReceiptTemplate({
      reference: booking.reference,
      guestName: booking.guest.name,
      roomName: booking.room.name,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      transactionReference: payment.transactionReference,
      paidAt: payment.paidAt ?? payment.createdAt,
      bookingUrl: siteUrl(`/dashboard/reservations/${booking.reference}`),
      outstandingBalance,
    }),
  });
}

export async function notifyAdminNewMessage(input: ContactMessageInput): Promise<EmailSendResult> {
  return sendToAdmin({
    ...adminNewMessageTemplate({
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      adminUrl: siteUrl("/admin/messages"),
    }),
  });
}
