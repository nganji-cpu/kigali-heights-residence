/**
 * Shared domain types for the Kigali Heights Residence design concept.
 *
 * Everything here describes illustrative content. Prices are illustrative
 * estimates in US dollars and do not represent real availability or tariffs.
 */

export type RoomCategory = "standard" | "deluxe" | "executive" | "penthouse";

export type RoomStatus = "available" | "occupied" | "maintenance" | "inactive";

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
  /** Operational state; optional for the static editorial data. */
  status?: RoomStatus;
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

export type BookingStatus = "draft" | "pending" | "confirmed" | "cancelled";
export type BookingServiceStatus = "confirmed" | "requested" | "cancelled";

export type UserRole = "customer" | "admin" | "staff";
export type UserStatus = "active" | "inactive" | "suspended";

/** Safe user shape returned by the session API and server components. */
export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

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
  /** Nullable for legacy reservations created before customer accounts. */
  customerId: number | null;
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
  confirmedAt: string | null;
  cancelledAt: string | null;
  replies?: AdminReplyRecord[];
}

/** Unfinished reservation, stored in MySQL and owned by one customer. */
export interface ReservationDraft {
  id: number;
  roomSlug: string | null;
  roomName: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  fullName: string;
  email: string;
  phone: string;
  requests: string;
  currentStep: number;
  serviceSlugs: string[];
  updatedAt: string;
}

/** A clear explanation of anything that changed since the draft was saved. */
export interface DraftWarning {
  field: "room" | "dates" | "guests" | "services" | "price";
  message: string;
}

export interface DraftResumeResult {
  draft: ReservationDraft;
  warnings: DraftWarning[];
}

export type PaymentMethod = "cash" | "bank_transfer" | "card" | "mobile_money" | "other";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface PaymentRecord {
  id: number;
  bookingReference: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionReference: string;
  paidAt: string | null;
  recordedByName: string | null;
  notes: string;
  createdAt: string;
}

export interface AdminStats {
  totalReservations: number;
  pendingReservations: number;
  confirmedReservations: number;
  cancelledReservations: number;
  availableRooms: number;
  occupiedRooms: number;
  registeredCustomers: number;
  revenue: number;
}

export interface AdminReservationSummary {
  reference: string;
  status: BookingStatus;
  customerId: number | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomName: string;
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  total: number;
  paidTotal: number;
  balance: number;
  createdAt: string;
}

export interface AdminCustomerSummary {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  status: UserStatus;
  createdAt: string;
  reservationCount: number;
  totalSpent: number;
}

export interface AdminStaffSummary {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface ReportPeriodRow {
  period: string;
  reservations: number;
  revenue: number;
}

export interface RoomReportRow {
  roomName: string;
  reservations: number;
  revenue: number;
}

export interface ReportSummary {
  periodRows: ReportPeriodRow[];
  statusRows: { status: BookingStatus; count: number }[];
  revenue: number;
  roomRows: RoomReportRow[];
  customerRows: { label: string; value: number }[];
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


/* ------------------------------------------------------------------------- */
/* Administration, Communication & Activity Logging                           */
/* ------------------------------------------------------------------------- */

export type ContactMessageStatus = "unread" | "read" | "handled" | "archived";

export interface ContactMessageRecord {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  readAt: string | null;
  handledAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  replies?: AdminReplyRecord[];
  notes?: AdminNoteRecord[];
}

export interface AdminActivityLogRecord {
  id: number;
  userId: number;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AdminNoteRecord {
  id: number;
  userId: number;
  userName: string;
  bookingId?: number | null;
  contactMessageId?: number | null;
  clientUserId?: number | null;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReplyRecord {
  id: number;
  contactMessageId?: number | null;
  bookingId?: number | null;
  senderType: "customer" | "admin" | "staff";
  userId?: number | null;
  senderName: string;
  senderEmail: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface AdminServiceRequestSummary {
  id: number;
  bookingId: number;
  bookingReference: string;
  guestName: string;
  guestEmail: string;
  serviceId: number;
  serviceSlug: string;
  serviceName: string;
  serviceCategory: ServiceCategory;
  quantity: number;
  unitPrice: number;
  amount: number;
  status: BookingServiceStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminClientSummary {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  status: UserStatus;
  createdAt: string;
  totalReservations: number;
  activeReservations: number;
  latestReservationDate: string | null;
  totalSpent: number;
}
