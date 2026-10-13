/**
 * Shared domain types for the Kigali Heights Residence concept prototype.
 *
 * Everything here describes *fictional sample content*. Prices are illustrative
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
