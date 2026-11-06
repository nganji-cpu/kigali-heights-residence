import { MAX_GUESTS } from "@/lib/booking";
import { toISODate } from "@/lib/utils";
import type { CreateBookingInput } from "@/types";
import { ApiError } from "./errors";

/**
 * Server-side request validation. Nothing here trusts a value supplied by the
 * browser — every field is re-checked, and the client never sends a price.
 */

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const PHONE_PATTERN = /^[+()\d][\d\s()+-]{5,}$/;

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 190;
const MAX_PHONE_LENGTH = 40;
const MAX_REQUESTS_LENGTH = 2000;
const MAX_SERVICES = 20;

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApiError(400, "INVALID_BODY", "Request body must be a JSON object.");
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** True only for a real calendar date in YYYY-MM-DD form. */
export function isValidISODate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
  );
}

/** Today in the server's local timezone, as YYYY-MM-DD. */
export function serverTodayISO(): string {
  return toISODate(new Date());
}

/**
 * Validates and normalises the body of POST /api/bookings.
 * Throws a 422 ApiError carrying per-field messages when anything is wrong.
 */
export function parseBookingBody(body: unknown): CreateBookingInput {
  const input = asRecord(body);
  const fields: Record<string, string> = {};

  const roomSlug = readString(input.roomSlug).trim();
  const checkIn = readString(input.checkIn).trim();
  const checkOut = readString(input.checkOut).trim();
  const fullName = readString(input.fullName).trim();
  const email = readString(input.email).trim();
  const phone = readString(input.phone).trim();
  const requests = readString(input.requests).trim();

  const rawGuests = input.guests;
  const guests =
    typeof rawGuests === "number"
      ? Math.trunc(rawGuests)
      : Number.parseInt(readString(rawGuests), 10);

  if (!roomSlug) {
    fields.roomSlug = "Please choose an apartment.";
  }

  const today = serverTodayISO();
  if (!checkIn) {
    fields.checkIn = "Please choose an arrival date.";
  } else if (!isValidISODate(checkIn)) {
    fields.checkIn = "Please choose a valid arrival date.";
  } else if (checkIn < today) {
    fields.checkIn = "Arrival cannot be earlier than today.";
  }

  if (!checkOut) {
    fields.checkOut = "Please choose a departure date.";
  } else if (!isValidISODate(checkOut)) {
    fields.checkOut = "Please choose a valid departure date.";
  } else if (isValidISODate(checkIn) && checkOut <= checkIn) {
    fields.checkOut = "Departure must be at least one night after arrival.";
  }

  if (!Number.isFinite(guests) || guests < 1) {
    fields.guests = "At least one guest is required.";
  } else if (guests > MAX_GUESTS) {
    fields.guests = `For groups larger than ${MAX_GUESTS}, please send a message through the contact page.`;
  }

  if (!fullName) {
    fields.fullName = "Please enter the lead guest's full name.";
  } else if (fullName.length < 2) {
    fields.fullName = "That name looks too short.";
  } else if (fullName.length > MAX_NAME_LENGTH) {
    fields.fullName = `Names must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }

  if (!email) {
    fields.email = "An email address is required.";
  } else if (!EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL_LENGTH) {
    fields.email = "Please enter a valid email address.";
  }

  if (!phone) {
    fields.phone = "A contact number is required.";
  } else if (!PHONE_PATTERN.test(phone) || phone.length > MAX_PHONE_LENGTH) {
    fields.phone = "Please enter a valid phone number.";
  }

  if (requests.length > MAX_REQUESTS_LENGTH) {
    fields.requests = `Please keep requests under ${MAX_REQUESTS_LENGTH} characters.`;
  }

  const rawServices = input.serviceSlugs;
  let serviceSlugs: string[] = [];
  if (rawServices !== undefined) {
    if (!Array.isArray(rawServices)) {
      fields.serviceSlugs = "Guest services must be a list.";
    } else {
      serviceSlugs = Array.from(
        new Set(
          rawServices
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      );
      if (serviceSlugs.length > MAX_SERVICES) {
        fields.serviceSlugs = "Too many guest services were selected.";
      }
    }
  }

  if (Object.keys(fields).length > 0) {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      "Please check the highlighted fields and try again.",
      fields,
    );
  }

  return {
    roomSlug,
    checkIn,
    checkOut,
    guests,
    fullName,
    email,
    phone,
    requests,
    serviceSlugs,
  };
}

export interface ServiceRequestInput {
  reference: string;
  serviceSlug: string;
}

/** Validates the body of POST /api/service-requests. */
export function parseServiceRequestBody(body: unknown): ServiceRequestInput {
  const input = asRecord(body);
  const fields: Record<string, string> = {};
  const reference = readString(input.reference).trim().toUpperCase();
  const serviceSlug = readString(input.serviceSlug).trim();

  if (!reference) {
    fields.reference = "A booking reference is required.";
  } else if (!/^KHR-[A-Z0-9]{4,20}$/.test(reference)) {
    fields.reference = "That booking reference does not look valid.";
  }

  if (!serviceSlug) {
    fields.serviceSlug = "Please choose a service.";
  }

  if (Object.keys(fields).length > 0) {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      "Please check the highlighted fields and try again.",
      fields,
    );
  }

  return { reference, serviceSlug };
}

export const CONTACT_SUBJECTS = [
  "general",
  "reservation",
  "long-stay",
  "services",
  "concept",
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export interface ContactMessageInput {
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
}

const MAX_CONTACT_MESSAGE_LENGTH = 4000;

/** Validates the body of POST /api/contact. */
export function parseContactBody(body: unknown): ContactMessageInput {
  const input = asRecord(body);
  const fields: Record<string, string> = {};

  const name = readString(input.name).trim();
  const email = readString(input.email).trim();
  const subject = readString(input.subject).trim();
  const message = readString(input.message).trim();

  if (!name) {
    fields.name = "Please tell us your name.";
  } else if (name.length > MAX_NAME_LENGTH) {
    fields.name = `Names must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }

  if (!email) {
    fields.email = "An email address is required.";
  } else if (!EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL_LENGTH) {
    fields.email = "Please enter a valid email address.";
  }

  if (!subject) {
    fields.subject = "Please choose a topic.";
  } else if (!CONTACT_SUBJECTS.includes(subject as ContactSubject)) {
    fields.subject = "Please choose one of the listed topics.";
  }

  if (!message) {
    fields.message = "Please add a short message.";
  } else if (message.length < 10) {
    fields.message = "A little more detail would help.";
  } else if (message.length > MAX_CONTACT_MESSAGE_LENGTH) {
    fields.message = `Please keep messages under ${MAX_CONTACT_MESSAGE_LENGTH} characters.`;
  }

  if (Object.keys(fields).length > 0) {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      "Please check the highlighted fields and try again.",
      fields,
    );
  }

  return { name, email, subject: subject as ContactSubject, message };
}

/** Validates a booking reference taken from the URL. */
export function parseReferenceParam(value: string): string {
  const reference = value.trim().toUpperCase();
  if (!/^KHR-[A-Z0-9]{4,20}$/.test(reference)) {
    throw new ApiError(400, "INVALID_REFERENCE", "That booking reference is not valid.");
  }
  return reference;
}

/* ------------------------------------------------------------------------- */
/* Accounts, drafts and administration                                        */
/* ------------------------------------------------------------------------- */

const MAX_PASSWORD_LENGTH = 128;
const MIN_PASSWORD_LENGTH = 10;

function readObjectField(input: Record<string, unknown>, key: string): string {
  return readString(input[key]).trim();
}

function throwValidation(fields: Record<string, string>, message: string): never {
  throw new ApiError(422, "VALIDATION_ERROR", message, fields);
}

function validateEmail(value: string, fields: Record<string, string>, field = "email"): void {
  if (!value) {
    fields[field] = "An email address is required.";
  } else if (!EMAIL_PATTERN.test(value) || value.length > MAX_EMAIL_LENGTH) {
    fields[field] = "Please enter a valid email address.";
  }
}

function validatePhone(value: string, fields: Record<string, string>, field = "phone"): void {
  if (!value) {
    fields[field] = "A contact number is required.";
  } else if (!PHONE_PATTERN.test(value) || value.length > MAX_PHONE_LENGTH) {
    fields[field] = "Please enter a valid phone number.";
  }
}

function validateName(value: string, fields: Record<string, string>, field = "fullName"): void {
  if (!value) {
    fields[field] = "Please enter your full name.";
  } else if (value.length < 2) {
    fields[field] = "That name looks too short.";
  } else if (value.length > MAX_NAME_LENGTH) {
    fields[field] = `Names must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }
}

function validatePassword(value: string, fields: Record<string, string>, field = "password"): void {
  if (!value) {
    fields[field] = "A password is required.";
  } else if (value.length < MIN_PASSWORD_LENGTH) {
    fields[field] = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  } else if (value.length > MAX_PASSWORD_LENGTH) {
    fields[field] = `Passwords must be ${MAX_PASSWORD_LENGTH} characters or fewer.`;
  } else if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    fields[field] = "Include at least one letter and one number.";
  }
}

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

/** Validates POST /api/auth/register. The role is deliberately not accepted. */
export function parseRegisterBody(body: unknown): RegisterInput {
  const input = asRecord(body);
  const fields: Record<string, string> = {};

  const fullName = readObjectField(input, "fullName");
  const email = readObjectField(input, "email").toLowerCase();
  const phone = readObjectField(input, "phone");
  const password = readString(input.password);

  validateName(fullName, fields);
  validateEmail(email, fields);
  validatePhone(phone, fields);
  validatePassword(password, fields);

  if (Object.keys(fields).length > 0) {
    throwValidation(fields, "Please check the highlighted fields and try again.");
  }

  return { fullName, email, phone, password };
}

export interface LoginInput {
  email: string;
  password: string;
}

/** Validates POST /api/auth/login. */
export function parseLoginBody(body: unknown): LoginInput {
  const input = asRecord(body);
  const fields: Record<string, string> = {};
  const email = readObjectField(input, "email").toLowerCase();
  const password = readString(input.password);

  validateEmail(email, fields);
  if (!password) fields.password = "Please enter your password.";

  if (Object.keys(fields).length > 0) {
    throwValidation(fields, "Please check the highlighted fields and try again.");
  }

  return { email, password };
}

export interface ProfileInput {
  fullName: string;
  email: string;
  phone: string;
}

/** Validates PATCH /api/account/profile. */
export function parseProfileBody(body: unknown): ProfileInput {
  const input = asRecord(body);
  const fields: Record<string, string> = {};
  const fullName = readObjectField(input, "fullName");
  const email = readObjectField(input, "email").toLowerCase();
  const phone = readObjectField(input, "phone");

  validateName(fullName, fields);
  validateEmail(email, fields);
  validatePhone(phone, fields);

  if (Object.keys(fields).length > 0) {
    throwValidation(fields, "Please check the highlighted fields and try again.");
  }

  return { fullName, email, phone };
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
}

/** Validates POST /api/account/password. */
export function parsePasswordChangeBody(body: unknown): PasswordChangeInput {
  const input = asRecord(body);
  const fields: Record<string, string> = {};
  const currentPassword = readString(input.currentPassword);
  const newPassword = readString(input.newPassword);

  if (!currentPassword) fields.currentPassword = "Enter your current password.";
  validatePassword(newPassword, fields, "newPassword");
  if (currentPassword && newPassword && currentPassword === newPassword) {
    fields.newPassword = "Choose a password you have not already used here.";
  }

  if (Object.keys(fields).length > 0) {
    throwValidation(fields, "Please check the highlighted fields and try again.");
  }

  return { currentPassword, newPassword };
}

export interface DraftInput {
  id: number | null;
  roomSlug: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  fullName: string;
  email: string;
  phone: string;
  requests: string;
  currentStep: number;
  serviceSlugs: string[];
}

/**
 * Validates POST /api/drafts. Drafts may be incomplete, so dates and the room
 * are optional, but anything supplied must still be well formed.
 */
export function parseDraftBody(body: unknown): DraftInput {
  const input = asRecord(body);
  const fields: Record<string, string> = {};

  const rawId = input.id;
  const id =
    rawId === undefined || rawId === null || rawId === ""
      ? null
      : Number.parseInt(String(rawId), 10);
  if (id !== null && (!Number.isFinite(id) || id < 1)) {
    fields.id = "That draft identifier is not valid.";
  }

  const roomSlug = readObjectField(input, "roomSlug") || null;
  const checkIn = readObjectField(input, "checkIn");
  const checkOut = readObjectField(input, "checkOut");
  const fullName = readString(input.fullName).trim();
  const email = readObjectField(input, "email").toLowerCase();
  const phone = readString(input.phone).trim();
  const requests = readString(input.requests).trim();

  if (roomSlug && roomSlug.length > 80) fields.roomSlug = "That apartment is not valid.";
  if (checkIn && !isValidISODate(checkIn)) fields.checkIn = "Please choose a valid arrival date.";
  if (checkOut && !isValidISODate(checkOut)) fields.checkOut = "Please choose a valid departure date.";
  if (checkIn && checkOut && checkOut <= checkIn) {
    fields.checkOut = "Departure must be after arrival.";
  }

  const rawGuests = input.guests;
  const guests =
    rawGuests === undefined || rawGuests === null
      ? 2
      : typeof rawGuests === "number"
        ? Math.trunc(rawGuests)
        : Number.parseInt(String(rawGuests), 10);
  if (!Number.isFinite(guests) || guests < 1 || guests > 6) {
    fields.guests = "Guests must be between 1 and 6.";
  }

  if (fullName && fullName.length < 2) fields.fullName = "That name looks too short.";
  if (fullName.length > MAX_NAME_LENGTH) {
    fields.fullName = `Names must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }
  if (email && (!EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL_LENGTH)) {
    fields.email = "Please enter a valid email address.";
  }
  if (phone && (!PHONE_PATTERN.test(phone) || phone.length > MAX_PHONE_LENGTH)) {
    fields.phone = "Please enter a valid phone number.";
  }
  if (requests.length > MAX_REQUESTS_LENGTH) {
    fields.requests = `Please keep requests under ${MAX_REQUESTS_LENGTH} characters.`;
  }

  const rawStep = input.currentStep;
  const currentStep =
    rawStep === undefined || rawStep === null ? 0 : Number.parseInt(String(rawStep), 10);
  if (!Number.isFinite(currentStep) || currentStep < 0 || currentStep > 3) {
    fields.currentStep = "That step is not valid.";
  }

  const rawServices = input.serviceSlugs;
  let serviceSlugs: string[] = [];
  if (rawServices !== undefined) {
    if (!Array.isArray(rawServices)) {
      fields.serviceSlugs = "Guest services must be a list.";
    } else {
      serviceSlugs = Array.from(
        new Set(
          rawServices
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      );
      if (serviceSlugs.length > MAX_SERVICES) {
        fields.serviceSlugs = "Too many guest services were selected.";
      }
    }
  }

  if (Object.keys(fields).length > 0) {
    throwValidation(fields, "Please check the highlighted fields and try again.");
  }

  return {
    id,
    roomSlug,
    checkIn,
    checkOut,
    guests,
    fullName,
    email,
    phone,
    requests,
    currentStep,
    serviceSlugs,
  };
}

export const RESERVATION_STATUSES = ["pending", "confirmed", "cancelled"] as const;
export type AdminReservationStatus = (typeof RESERVATION_STATUSES)[number];

/** Validates PATCH /api/admin/reservations/[reference]. */
export function parseReservationStatusBody(body: unknown): AdminReservationStatus {
  const input = asRecord(body);
  const status = readString(input.status).trim();
  if (!RESERVATION_STATUSES.includes(status as AdminReservationStatus)) {
    throwValidation(
      { status: "Choose pending, confirmed or cancelled." },
      "Please choose a valid reservation status.",
    );
  }
  return status as AdminReservationStatus;
}

export const ROOM_STATUSES = ["available", "occupied", "maintenance", "inactive"] as const;
export type AdminRoomStatus = (typeof ROOM_STATUSES)[number];

/** Validates PATCH /api/admin/rooms/[slug]. */
export function parseRoomStatusBody(body: unknown): AdminRoomStatus {
  const input = asRecord(body);
  const status = readString(input.status).trim();
  if (!ROOM_STATUSES.includes(status as AdminRoomStatus)) {
    throwValidation(
      { status: "Choose available, occupied, maintenance or inactive." },
      "Please choose a valid room status.",
    );
  }
  return status as AdminRoomStatus;
}

export const PAYMENT_METHODS = ["cash", "bank_transfer", "card", "mobile_money", "other"] as const;
export const PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded"] as const;

export interface PaymentInput {
  bookingReference: string;
  amount: number;
  method: (typeof PAYMENT_METHODS)[number];
  status: (typeof PAYMENT_STATUSES)[number];
  transactionReference: string;
  paidAt: string | null;
  notes: string;
}

/** Validates POST /api/admin/payments. */
export function parsePaymentBody(body: unknown): PaymentInput {
  const input = asRecord(body);
  const fields: Record<string, string> = {};

  const bookingReference = readObjectField(input, "bookingReference").toUpperCase();
  if (!/^KHR-[A-Z0-9]{4,20}$/.test(bookingReference)) {
    fields.bookingReference = "Enter a valid booking reference.";
  }

  const rawAmount = input.amount;
  const amount =
    typeof rawAmount === "number" ? rawAmount : Number.parseFloat(String(rawAmount ?? ""));
  if (!Number.isFinite(amount) || amount <= 0) {
    fields.amount = "Enter an amount greater than zero.";
  } else if (amount > 1_000_000) {
    fields.amount = "That amount is too large.";
  }

  const method = readObjectField(input, "method");
  if (!PAYMENT_METHODS.includes(method as (typeof PAYMENT_METHODS)[number])) {
    fields.method = "Choose a payment method.";
  }

  const status = readObjectField(input, "status") || "completed";
  if (!PAYMENT_STATUSES.includes(status as (typeof PAYMENT_STATUSES)[number])) {
    fields.status = "Choose a payment status.";
  }

  const transactionReference = readObjectField(input, "transactionReference");
  if (transactionReference.length > 120) {
    fields.transactionReference = "Keep the transaction reference under 120 characters.";
  }

  const rawPaidAt = readObjectField(input, "paidAt");
  if (rawPaidAt && !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(rawPaidAt)) {
    fields.paidAt = "Enter a valid payment date.";
  }

  const notes = readString(input.notes).trim();
  if (notes.length > 255) fields.notes = "Keep notes under 255 characters.";

  if (Object.keys(fields).length > 0) {
    throwValidation(fields, "Please check the highlighted fields and try again.");
  }

  return {
    bookingReference,
    amount: Math.round(amount * 100) / 100,
    method: method as PaymentInput["method"],
    status: status as PaymentInput["status"],
    transactionReference,
    paidAt: rawPaidAt || null,
    notes,
  };
}

export interface StaffCreateInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

/** Validates POST /api/admin/staff. Only the `staff` role can be created here. */
export function parseStaffBody(body: unknown): StaffCreateInput {
  const input = asRecord(body);
  const fields: Record<string, string> = {};
  const fullName = readObjectField(input, "fullName");
  const email = readObjectField(input, "email").toLowerCase();
  const phone = readObjectField(input, "phone");
  const password = readString(input.password);

  validateName(fullName, fields);
  validateEmail(email, fields);
  validatePhone(phone, fields);
  validatePassword(password, fields);

  if (Object.keys(fields).length > 0) {
    throwValidation(fields, "Please check the highlighted fields and try again.");
  }

  return { fullName, email, phone, password };
}

export const STAFF_STATUSES = ["active", "inactive", "suspended"] as const;
export type StaffStatus = (typeof STAFF_STATUSES)[number];

/** Validates PATCH /api/admin/staff/[id]. */
export function parseStaffStatusBody(body: unknown): StaffStatus {
  const input = asRecord(body);
  const status = readString(input.status).trim();
  if (!STAFF_STATUSES.includes(status as StaffStatus)) {
    throwValidation(
      { status: "Choose active, inactive or suspended." },
      "Please choose a valid account status.",
    );
  }
  return status as StaffStatus;
}

/** Parses a positive numeric identifier taken from a URL. */
export function parseIdParam(value: string): number {
  const id = Number.parseInt(value, 10);
  if (!Number.isFinite(id) || id < 1 || String(id) !== value.trim()) {
    throw new ApiError(400, "INVALID_ID", "That identifier is not valid.");
  }
  return id;
}


/* ------------------------------------------------------------------------- */
/* Contact Messages, Communication & Service Request Validations              */
/* ------------------------------------------------------------------------- */

export const CONTACT_MESSAGE_STATUSES = ["unread", "read", "handled", "archived"] as const;
export type ContactMessageStatusInput = (typeof CONTACT_MESSAGE_STATUSES)[number];

export function parseContactMessageStatusBody(body: unknown): ContactMessageStatusInput {
  const input = asRecord(body);
  const status = readString(input.status).trim();
  if (!CONTACT_MESSAGE_STATUSES.includes(status as ContactMessageStatusInput)) {
    throwValidation(
      { status: "Choose unread, read, handled or archived." },
      "Please choose a valid message status.",
    );
  }
  return status as ContactMessageStatusInput;
}

export interface AdminReplyInput {
  message: string;
}

export function parseAdminReplyBody(body: unknown): AdminReplyInput {
  const input = asRecord(body);
  const message = readString(input.message).trim();
  if (!message) {
    throwValidation({ message: "Please enter a reply message." }, "Reply message cannot be empty.");
  }
  if (message.length < 2) {
    throwValidation({ message: "Reply message is too short." }, "Please provide more details.");
  }
  if (message.length > 5000) {
    throwValidation({ message: "Reply message must be under 5000 characters." }, "Message is too long.");
  }
  return { message };
}

export interface AdminNoteInput {
  note: string;
  bookingReference?: string;
  contactMessageId?: number;
  clientUserId?: number;
}

export function parseAdminNoteBody(body: unknown): AdminNoteInput {
  const input = asRecord(body);
  const note = readString(input.note).trim();
  if (!note) {
    throwValidation({ note: "Please enter a note." }, "Note cannot be empty.");
  }
  if (note.length > 5000) {
    throwValidation({ note: "Note must be under 5000 characters." }, "Note is too long.");
  }

  const bookingReference = readString(input.bookingReference).trim().toUpperCase() || undefined;
  const rawMsgId = input.contactMessageId;
  const contactMessageId = typeof rawMsgId === "number" ? rawMsgId : undefined;
  const rawClientId = input.clientUserId;
  const clientUserId = typeof rawClientId === "number" ? rawClientId : undefined;

  return { note, bookingReference, contactMessageId, clientUserId };
}

export const SERVICE_REQUEST_STATUSES = ["requested", "confirmed", "cancelled"] as const;
export type ServiceRequestStatusInput = (typeof SERVICE_REQUEST_STATUSES)[number];

export interface ServiceRequestUpdateInput {
  status: ServiceRequestStatusInput;
  notes?: string;
}

export function parseServiceRequestUpdateBody(body: unknown): ServiceRequestUpdateInput {
  const input = asRecord(body);
  const status = readString(input.status).trim();
  if (!SERVICE_REQUEST_STATUSES.includes(status as ServiceRequestStatusInput)) {
    throwValidation(
      { status: "Choose requested, confirmed or cancelled." },
      "Please choose a valid service request status.",
    );
  }
  const notes = readString(input.notes).trim() || undefined;
  return { status: status as ServiceRequestStatusInput, notes };
}

/* ------------------------------------------------------------------------- */
/* Password reset                                                            */
/* ------------------------------------------------------------------------- */

export type ResetPortal = "customer" | "admin";

export interface ForgotPasswordInput {
  email: string;
  portal: ResetPortal;
}

/** Validates POST /api/auth/forgot-password. */
export function parseForgotPasswordBody(body: unknown): ForgotPasswordInput {
  const input = asRecord(body);
  const fields: Record<string, string> = {};
  const email = readObjectField(input, "email").toLowerCase();
  const portal = readString(input.portal).trim() === "admin" ? "admin" : "customer";

  validateEmail(email, fields);

  if (Object.keys(fields).length > 0) {
    throwValidation(fields, "Please enter a valid email address.");
  }

  return { email, portal };
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

/** Validates POST /api/auth/reset-password. */
export function parseResetPasswordBody(body: unknown): ResetPasswordInput {
  const input = asRecord(body);
  const fields: Record<string, string> = {};
  const token = readString(input.token).trim();
  const password = readString(input.password);

  if (!token) {
    fields.token = "The reset link is missing its token.";
  } else if (!/^[A-Za-z0-9_-]{20,200}$/.test(token)) {
    fields.token = "That reset link is not valid.";
  }
  validatePassword(password, fields);

  if (Object.keys(fields).length > 0) {
    throwValidation(fields, "Please choose a valid new password.");
  }

  return { token, password };
}
