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
