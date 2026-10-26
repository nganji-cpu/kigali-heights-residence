/**
 * Shared domain types for the Kigali Heights Residence design concept.
 *
 * Everything here describes illustrative content. Prices are illustrative
 * estimates in US dollars and do not represent real availability or tariffs.
 */

export type RoomCategory = "standard" | "deluxe" | "executive" | "penthouse";

export interface Room {
  /** Stable identifier, e.g. "rm-standard-city" */
  id: string;
  /** URL segment used by /rooms/[slug] */
  slug: string;
  name: string;
  category: RoomCategory;
  /** Building level the apartment sits on (2–5). */
  floor: LevelNumber;
  /** Short editorial summary used on cards. */
  summary: string;
  /** Longer description used on the room details page. */
  description: string;
  /** Illustrative nightly rate in USD. */
  pricePerNight: number;
  capacity: number;
  /** Interior size in square metres. */
  size: number;
  bedType: string;
  view: string;
  amenities: string[];
  /** Image paths relative to /public, e.g. "/images/room-deluxe.jpg" */
  images: string[];
  featured: boolean;
}

export type PricingType =
  | "per-trip"
  | "per-day"
  | "per-person"
  | "per-person-day"
  | "per-booking";

export type ServiceCategory =
  | "transport"
  | "dining"
  | "lifestyle"
  | "business";

export interface Service {
  id: string;
  slug: string;
  name: string;
  category: ServiceCategory;
  summary: string;
  description: string;
  /** Illustrative sample price in USD. */
  samplePrice: number;
  pricingType: PricingType;
  /** Human readable note clarifying that the price is an estimate. */
  priceNote: string;
  /** Lucide icon name resolved in components/services/service-icon.tsx */
  icon: string;
  image: string;
}

export type LevelNumber = 1 | 2 | 3 | 4 | 5;

export interface ResidenceLevel {
  level: LevelNumber;
  name: string;
  tagline: string;
  description: string;
  facilities: string[];
  image: string;
  imageAlt: string;
  /** Room category that best represents this level, when applicable. */
  category: RoomCategory | null;
}

export interface ExperienceSection {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  /** Optional supporting paragraph for an editorial pull-quote. */
  quote?: string;
  images: { src: string; alt: string }[];
}

export interface BookingSelection {
  checkIn: string;
  checkOut: string;
  guests: number;
  roomSlug: string | null;
  services: string[];
}

export interface PriceLine {
  label: string;
  detail?: string;
  amount: number;
}

export interface PriceBreakdown {
  nights: number;
  subtotal: number;
  servicesTotal: number;
  total: number;
  lines: PriceLine[];
}

export interface BookingFormValues {
  fullName: string;
  email: string;
  phone: string;
  requests: string;
}

export type BookingFormErrors = Partial<
  Record<
    keyof BookingFormValues | "checkIn" | "checkOut" | "guests" | "roomSlug",
    string
  >
>;

/* ------------------------------------------------------------------------- */
/* Backend / API types                                                       */
/* ------------------------------------------------------------------------- */

/** Input accepted by POST /api/bookings. Totals are never supplied by the client. */
export interface CreateBookingInput {
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  fullName: string;
  email: string;
  phone: string;
  requests: string;
  serviceSlugs: string[];
}

export type BookingStatus = "confirmed" | "cancelled";
export type BookingServiceStatus = "confirmed" | "requested" | "cancelled";

export interface BookingRoomSummary {
  slug: string;
  name: string;
  category: RoomCategory;
  floor: LevelNumber;
  pricePerNight: number;
}

export interface BookingServiceSummary {
  slug: string;
  name: string;
  pricingType: PricingType;
  amount: number;
  status: BookingServiceStatus;
}

/** A booking exactly as stored, with server-calculated totals. */
export interface BookingRecord {
  reference: string;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  guest: {
    name: string;
    email: string;
    phone: string;
    requests: string;
  };
  room: BookingRoomSummary;
  services: BookingServiceSummary[];
  price: PriceBreakdown;
  createdAt: string;
}

export interface RoomMetaResponse {
  categories: { value: RoomCategory; label: string; blurb: string }[];
  amenities: string[];
  levels: { level: LevelNumber; rooms: number }[];
}

/** Public list shape for GET /api/bookings (no contact details). */
export interface BookingSummary {
  reference: string;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  room: BookingRoomSummary;
  total: number;
  createdAt: string;
}

export interface ApiErrorBody {
  error: {
    message: string;
    code: string;
    /** Optional per-field messages, keyed by form field name. */
    fields?: Record<string, string>;
  };
}
