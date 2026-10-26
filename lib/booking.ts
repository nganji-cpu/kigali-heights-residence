import type {
  BookingFormErrors,
  BookingFormValues,
  BookingSelection,
  PriceBreakdown,
  Room,
  Service,
} from "@/types";
import { daysBetween, formatUSD } from "@/lib/utils";

/**
 * Booking domain logic for the concept.
 *
 * All calculations are illustrative. Nothing here talks to a server, charges a
 * card, or creates a real reservation.
 */

export const BOOKING_STORAGE_KEY = "khr.booking.draft.v1";
export const SERVICES_STORAGE_KEY = "khr.services.selected.v1";

export const MAX_GUESTS = 6;

/** Number of nights between check-in and check-out. */
export function calculateNights(checkIn: string, checkOut: string): number {
  const nights = daysBetween(checkIn, checkOut);
  return nights > 0 ? nights : 0;
}

export interface StayValidationInput {
  checkIn: string;
  checkOut: string;
  guests: number;
  room: Room | undefined;
  /**
   * Today's ISO date, or `null` while prerendering. Callers read it from
   * `useToday()` so validation never touches the clock during render.
   */
  today?: string | null;
}

export type StayErrors = Partial<
  Record<"checkIn" | "checkOut" | "guests" | "roomSlug", string>
>;

/**
 * Validates the stay selection. Rules:
 *  - check-in is required and cannot be in the past
 *  - check-out is required and must be at least one night after check-in
 *  - guest count must be at least 1 and within the apartment capacity
 */
export function validateStay({
  checkIn,
  checkOut,
  guests,
  room,
  today = null,
}: StayValidationInput): StayErrors {
  const errors: StayErrors = {};

  if (!checkIn) {
    errors.checkIn = "Please choose an arrival date.";
  } else if (today && checkIn < today) {
    errors.checkIn = "Arrival cannot be earlier than today.";
  }

  if (!checkOut) {
    errors.checkOut = "Please choose a departure date.";
  } else if (checkIn && checkOut <= checkIn) {
    errors.checkOut = "Departure must be at least one night after arrival.";
  }

  if (!Number.isFinite(guests) || guests < 1) {
    errors.guests = "At least one guest is required.";
  } else if (guests > MAX_GUESTS) {
    errors.guests = `For groups larger than ${MAX_GUESTS}, please send a message through the contact page.`;
  } else if (room && guests > room.capacity) {
    errors.guests = `${room.name} sleeps up to ${room.capacity} guests.`;
  }

  if (!room) {
    errors.roomSlug = "Please choose an apartment to continue.";
  }

  return errors;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const PHONE_PATTERN = /^[+()\d][\d\s()+-]{5,}$/;

/** Validates the guest details step. */
export function validateGuestDetails(values: BookingFormValues): BookingFormErrors {
  const errors: BookingFormErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Please enter the lead guest's full name.";
  } else if (values.fullName.trim().length < 2) {
    errors.fullName = "That name looks too short.";
  }

  if (!values.email.trim()) {
    errors.email = "An email address is required for the confirmation summary.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.phone.trim()) {
    errors.phone = "A contact number is required for the reservation record.";
  } else if (!PHONE_PATTERN.test(values.phone.trim())) {
    errors.phone = "Please enter a valid phone number.";
  }

  return errors;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}

/**
 * Illustrative cost of a single service for the given stay.
 * Quantities are derived from nights and guests depending on the price type.
 */
export function serviceAmount(service: Service, nights: number, guests: number): number {
  const safeNights = Math.max(nights, 1);
  const safeGuests = Math.max(guests, 1);

  switch (service.pricingType) {
    case "per-trip":
    case "per-booking":
      return service.samplePrice;
    case "per-day":
      return service.samplePrice * safeNights;
    case "per-person":
      return service.samplePrice * safeGuests;
    case "per-person-day":
      return service.samplePrice * safeGuests * safeNights;
    default:
      return service.samplePrice;
  }
}

interface BuildBreakdownInput {
  room: Room | undefined;
  nights: number;
  guests: number;
  services: Service[];
}

/** Builds the itemised, illustrative price breakdown shown in the summary. */
export function buildPriceBreakdown({
  room,
  nights,
  guests,
  services,
}: BuildBreakdownInput): PriceBreakdown {
  const lines: PriceBreakdown["lines"] = [];
  const safeNights = Math.max(nights, 0);

  let subtotal = 0;
  if (room && safeNights > 0) {
    subtotal = room.pricePerNight * safeNights;
    lines.push({
      label: room.name,
      detail: `${formatUSD(room.pricePerNight)} × ${safeNights} nights`,
      amount: subtotal,
    });
  }

  let servicesTotal = 0;
  for (const service of services) {
    const amount = serviceAmount(service, safeNights || 1, guests);
    servicesTotal += amount;
    lines.push({
      label: service.name,
      detail: service.priceNote,
      amount,
    });
  }

  return {
    nights: safeNights,
    subtotal,
    servicesTotal,
    total: subtotal + servicesTotal,
    lines,
  };
}

/* ------------------------------------------------------------------ */
/* Browser storage — always guarded so server rendering stays clean.   */
/* ------------------------------------------------------------------ */

function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseSelectedServices(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function parseBookingDraft(raw: string | null): Partial<BookingSelection> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as Partial<BookingSelection>;
  } catch {
    return {};
  }
}

export function readSelectedServices(): string[] {
  return parseSelectedServices(readRaw(SERVICES_STORAGE_KEY));
}

export function writeSelectedServices(slugs: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    /* Storage can be unavailable in private mode; the page still works. */
  }
}

export function readBookingDraft(): Partial<BookingSelection> {
  return parseBookingDraft(readRaw(BOOKING_STORAGE_KEY));
}

export function writeBookingDraft(draft: Partial<BookingSelection>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

/**
 * Minimal external-store contract consumed by `useSyncExternalStore` in
 * `lib/client-store.ts`.
 *
 * Browser-only state (the clock, `localStorage`) cannot be read during render —
 * Next.js prerenders Client Components and would raise an unstable-value error,
 * and hydrating it from a `useEffect` causes cascading renders. An external
 * store lets the server render a stable fallback and swaps in the real value
 * after hydration.
 */
export interface ReadonlyStore<T> {
  subscribe(onStoreChange: () => void): () => void;
  getSnapshot(): T;
  getServerSnapshot(): T;
}

function createStorageStore<T>(
  key: string,
  parse: (raw: string | null) => T,
  serverSnapshot: T,
): ReadonlyStore<T> {
  let lastRaw: string | null | undefined;
  let cached: T = serverSnapshot;

  return {
    subscribe(onStoreChange) {
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === key) onStoreChange();
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
    getSnapshot() {
      const raw = readRaw(key);
      if (raw !== lastRaw) {
        lastRaw = raw;
        cached = parse(raw);
      }
      return cached;
    },
    getServerSnapshot() {
      return serverSnapshot;
    },
  };
}

const emptyServices: string[] = [];
const emptyDraft: Partial<BookingSelection> = {};

/** Guest services saved from the services page, shared across the session. */
export const selectedServicesStore: ReadonlyStore<string[]> = createStorageStore(
  SERVICES_STORAGE_KEY,
  parseSelectedServices,
  emptyServices,
);

/** The in-progress reservation draft persisted to this browser. */
export const bookingDraftStore: ReadonlyStore<Partial<BookingSelection>> = createStorageStore(
  BOOKING_STORAGE_KEY,
  parseBookingDraft,
  emptyDraft,
);
