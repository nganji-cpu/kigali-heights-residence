import "server-only";
import { randomBytes } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { Pool, PoolConnection } from "mysql2/promise";
import { getPool } from "@/lib/db";
import { calculateNights, serviceAmount } from "@/lib/booking";
import { formatUSD } from "@/lib/utils";
import type {
  BookingRecord,
  BookingServiceStatus,
  BookingStatus,
  LevelNumber,
  PriceLine,
  PricingType,
  Room,
  RoomCategory,
  RoomMetaResponse,
  Service,
  ServiceCategory,
} from "@/types";
import { ApiError } from "./errors";
import { serverTodayISO, type ContactMessageInput } from "./validation";

/* ------------------------------------------------------------------------- */
/* Row types                                                                 */
/* ------------------------------------------------------------------------- */

interface RoomRow extends RowDataPacket {
  id: number;
  apartmentId: number;
  apartmentSlug: string;
  apartmentName: string;
  slug: string;
  name: string;
  category: RoomCategory;
  floor: number;
  summary: string;
  description: string;
  pricePerNight: number;
  capacity: number;
  size: number;
  bedType: string;
  view: string;
  featured: number;
}

interface AmenityRow extends RowDataPacket {
  roomId: number;
  name: string;
}

interface ImageRow extends RowDataPacket {
  roomId: number;
  imagePath: string;
}

interface ApartmentRow extends RowDataPacket {
  slug: RoomCategory;
  name: string;
  description: string;
}

interface AmenityNameRow extends RowDataPacket {
  name: string;
}

interface LevelCountRow extends RowDataPacket {
  level: number;
  rooms: number;
}

interface ServiceRow extends RowDataPacket {
  id: number;
  slug: string;
  name: string;
  category: ServiceCategory;
  summary: string;
  description: string;
  samplePrice: number;
  pricingType: PricingType;
  priceNote: string;
  icon: string;
  imagePath: string;
}

interface BookingRow extends RowDataPacket {
  id: number;
  reference: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  requests: string | null;
  nights: number;
  roomTotal: number;
  servicesTotal: number;
  total: number;
  status: BookingStatus;
  createdAt: string;
  roomSlug: string;
  roomName: string;
  category: RoomCategory;
  floor: number;
  pricePerNight: number;
}

interface BookingServiceRow extends RowDataPacket {
  bookingId: number;
  slug: string;
  name: string;
  pricingType: PricingType;
  priceNote: string;
  amount: number;
  status: BookingServiceStatus;
}

/* ------------------------------------------------------------------------- */
/* SQL fragments                                                             */
/* ------------------------------------------------------------------------- */

const ROOM_SELECT = `
  SELECT
    r.id,
    r.apartment_id AS apartmentId,
    ap.slug AS apartmentSlug,
    ap.name AS apartmentName,
    r.slug,
    r.name,
    r.category,
    r.floor,
    r.summary,
    r.description,
    r.price_per_night AS pricePerNight,
    r.capacity,
    r.size_sqm AS size,
    r.bed_type AS bedType,
    r.view_name AS view,
    r.featured
  FROM rooms r
  JOIN apartments ap ON ap.id = r.apartment_id
`;

const SERVICE_SELECT = `
  SELECT
    id, slug, name, category, summary, description,
    sample_price AS samplePrice,
    pricing_type AS pricingType,
    price_note AS priceNote,
    icon,
    image_path AS imagePath
  FROM services
`;

const SERVICE_ORDER = `
  ORDER BY FIELD(category, 'transport', 'dining', 'lifestyle', 'business'), name ASC
`;

const BOOKING_SELECT = `
  SELECT
    b.id,
    b.reference,
    b.check_in AS checkIn,
    b.check_out AS checkOut,
    b.guests,
    b.guest_name AS guestName,
    b.guest_email AS guestEmail,
    b.guest_phone AS guestPhone,
    b.requests,
    b.nights,
    b.room_total AS roomTotal,
    b.services_total AS servicesTotal,
    b.total,
    b.status,
    b.created_at AS createdAt,
    r.slug AS roomSlug,
    r.name AS roomName,
    r.category,
    r.floor,
    r.price_per_night AS pricePerNight
  FROM bookings b
  JOIN rooms r ON r.id = b.room_id
`;

const BOOKING_SERVICE_SELECT = `
  SELECT
    bs.booking_id AS bookingId,
    s.slug,
    s.name,
    s.pricing_type AS pricingType,
    s.price_note AS priceNote,
    bs.amount,
    bs.status
  FROM booking_services bs
  JOIN services s ON s.id = bs.service_id
`;

/* ------------------------------------------------------------------------- */
/* Mappers                                                                   */
/* ------------------------------------------------------------------------- */

function toLevel(value: number): LevelNumber {
  // The schema constrains floors to 2–5; this keeps TypeScript honest.
  return (value === 2 || value === 3 || value === 4 || value === 5 ? value : 2) as LevelNumber;
}

function mapRoom(row: RoomRow, amenities: string[], images: string[]): Room {
  return {
    id: `rm-${row.id}`,
    slug: row.slug,
    name: row.name,
    category: row.category,
    floor: toLevel(Number(row.floor)),
    summary: row.summary,
    description: row.description,
    pricePerNight: Number(row.pricePerNight),
    capacity: Number(row.capacity),
    size: Number(row.size),
    bedType: row.bedType,
    view: row.view,
    amenities,
    images,
    featured: Boolean(row.featured),
  };
}

function mapService(row: ServiceRow): Service {
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    category: row.category,
    summary: row.summary,
    description: row.description,
    samplePrice: Number(row.samplePrice),
    pricingType: row.pricingType,
    priceNote: row.priceNote,
    icon: row.icon,
    image: row.imagePath,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/* ------------------------------------------------------------------------- */
/* Room relations                                                            */
/* ------------------------------------------------------------------------- */

async function loadRelations(
  roomIds: number[],
  db: Pool | PoolConnection,
): Promise<{ amenities: Map<number, string[]>; images: Map<number, string[]> }> {
  const amenities = new Map<number, string[]>();
  const images = new Map<number, string[]>();

  if (roomIds.length === 0) return { amenities, images };

  const [amenityRows] = await db.query<AmenityRow[]>(
    `SELECT ra.room_id AS roomId, a.name
       FROM room_amenities ra
       JOIN amenities a ON a.id = ra.amenity_id
      WHERE ra.room_id IN (?)
      ORDER BY ra.amenity_id ASC`,
    [roomIds],
  );

  for (const row of amenityRows) {
    const list = amenities.get(Number(row.roomId)) ?? [];
    list.push(row.name);
    amenities.set(Number(row.roomId), list);
  }

  const [imageRows] = await db.query<ImageRow[]>(
    `SELECT ri.room_id AS roomId, ri.image_path AS imagePath
       FROM room_images ri
      WHERE ri.room_id IN (?)
      ORDER BY ri.sort_order ASC`,
    [roomIds],
  );

  for (const row of imageRows) {
    const list = images.get(Number(row.roomId)) ?? [];
    list.push(row.imagePath);
    images.set(Number(row.roomId), list);
  }

  return { amenities, images };
}

/* ------------------------------------------------------------------------- */
/* Rooms                                                                     */
/* ------------------------------------------------------------------------- */

export interface ListRoomsOptions {
  category?: string;
  level?: number;
  guests?: number;
  featuredOnly?: boolean;
  limit?: number;
}

export async function listRooms(options: ListRoomsOptions = {}): Promise<Room[]> {
  const pool = getPool();
  const where: string[] = [];
  const params: Array<string | number> = [];

  if (options.category) {
    where.push("r.category = ?");
    params.push(options.category);
  }
  if (options.level) {
    where.push("r.floor = ?");
    params.push(options.level);
  }
  if (options.guests) {
    where.push("r.capacity >= ?");
    params.push(options.guests);
  }
  if (options.featuredOnly) {
    where.push("r.featured = 1");
  }

  const limitClause = options.limit ? " LIMIT ?" : "";
  if (options.limit) params.push(options.limit);

  const [rows] = await pool.query<RoomRow[]>(
    `${ROOM_SELECT}
     ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY r.price_per_night ASC${limitClause}`,
    params,
  );

  const relations = await loadRelations(
    rows.map((row) => Number(row.id)),
    pool,
  );

  return rows.map((row) =>
    mapRoom(
      row,
      relations.amenities.get(Number(row.id)) ?? [],
      relations.images.get(Number(row.id)) ?? [],
    ),
  );
}

export async function getRoomBySlug(slug: string): Promise<Room | null> {
  const pool = getPool();
  const [rows] = await pool.query<RoomRow[]>(
    `${ROOM_SELECT} WHERE r.slug = ? LIMIT 1`,
    [slug],
  );

  const row = rows[0];
  if (!row) return null;

  const relations = await loadRelations([Number(row.id)], pool);
  return mapRoom(
    row,
    relations.amenities.get(Number(row.id)) ?? [],
    relations.images.get(Number(row.id)) ?? [],
  );
}

export async function getRelatedRooms(slug: string, limit = 3): Promise<Room[]> {
  const all = await listRooms();
  const current = all.find((room) => room.slug === slug);
  if (!current) return all.slice(0, limit);

  const scored = all
    .filter((room) => room.slug !== slug)
    .map((room) => {
      let score = 0;
      if (room.category === current.category) score += 3;
      if (room.floor === current.floor) score += 2;
      if (Math.abs(room.floor - current.floor) === 1) score += 1;
      return { room, score };
    })
    .sort((a, b) => b.score - a.score || a.room.pricePerNight - b.room.pricePerNight);

  return scored.slice(0, limit).map((entry) => entry.room);
}

export async function getRoomMeta(): Promise<RoomMetaResponse> {
  const pool = getPool();

  const [categoryRows] = await pool.query<ApartmentRow[]>(
    "SELECT slug, name, description FROM apartments ORDER BY id ASC",
  );
  const [amenityRows] = await pool.query<AmenityNameRow[]>(
    "SELECT name FROM amenities ORDER BY id ASC",
  );
  const [levelRows] = await pool.query<LevelCountRow[]>(
    "SELECT floor AS level, COUNT(*) AS rooms FROM rooms GROUP BY floor ORDER BY floor ASC",
  );

  return {
    categories: categoryRows.map((row) => ({
      value: row.slug,
      label: row.name,
      blurb: row.description,
    })),
    amenities: amenityRows.map((row) => row.name),
    levels: levelRows.map((row) => ({
      level: toLevel(Number(row.level)),
      rooms: Number(row.rooms),
    })),
  };
}

/* ------------------------------------------------------------------------- */
/* Services                                                                  */
/* ------------------------------------------------------------------------- */

export async function listServices(): Promise<Service[]> {
  const pool = getPool();
  const [rows] = await pool.query<ServiceRow[]>(`${SERVICE_SELECT} ${SERVICE_ORDER}`);
  return rows.map(mapService);
}

export async function getServicesBySlugs(
  slugs: string[],
  db: Pool | PoolConnection = getPool(),
): Promise<Service[]> {
  if (slugs.length === 0) return [];
  const [rows] = await db.query<ServiceRow[]>(
    `${SERVICE_SELECT} WHERE slug IN (?) ${SERVICE_ORDER}`,
    [slugs],
  );
  return rows.map(mapService);
}

/* ------------------------------------------------------------------------- */
/* Availability                                                              */
/* ------------------------------------------------------------------------- */

export interface AvailabilityResult {
  roomSlug: string;
  available: boolean;
  nights: number;
  pricePerNight: number;
  capacity: number;
}

export async function checkAvailability(
  roomSlug: string,
  checkIn: string,
  checkOut: string,
): Promise<AvailabilityResult | null> {
  const pool = getPool();
  const [roomRows] = await pool.query<RoomRow[]>(
    `SELECT r.id, r.slug, r.price_per_night AS pricePerNight, r.capacity
       FROM rooms r
      WHERE r.slug = ?
      LIMIT 1`,
    [roomSlug],
  );

  const room = roomRows[0];
  if (!room) return null;

  const [conflicts] = await pool.query<RowDataPacket[]>(
    `SELECT id
       FROM bookings
      WHERE room_id = ?
        AND status = 'confirmed'
        AND check_in < ?
        AND check_out > ?
      LIMIT 1`,
    [Number(room.id), checkOut, checkIn],
  );

  return {
    roomSlug: room.slug,
    available: conflicts.length === 0,
    nights: calculateNights(checkIn, checkOut),
    pricePerNight: Number(room.pricePerNight),
    capacity: Number(room.capacity),
  };
}

/* ------------------------------------------------------------------------- */
/* Bookings                                                                  */
/* ------------------------------------------------------------------------- */

export interface CreateBookingData {
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

function generateBookingReference(): string {
  return `KHR-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function createBooking(data: CreateBookingData): Promise<BookingRecord> {
  const pool = getPool();
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();

    // Locking the room row serialises concurrent booking attempts for the same
    // room, so the overlap check and the insert cannot race.
    const [roomRows] = await connection.query<RoomRow[]>(
      `${ROOM_SELECT} WHERE r.slug = ? LIMIT 1 FOR UPDATE`,
      [data.roomSlug],
    );

    const roomRow = roomRows[0];
    if (!roomRow) {
      throw new ApiError(404, "ROOM_NOT_FOUND", "That apartment does not exist.");
    }

    if (data.guests > Number(roomRow.capacity)) {
      throw new ApiError(
        422,
        "GUEST_CAPACITY",
        `${roomRow.name} sleeps up to ${roomRow.capacity} guests.`,
        { guests: `This apartment sleeps up to ${roomRow.capacity} guests.` },
      );
    }

    const today = serverTodayISO();
    if (data.checkIn < today) {
      throw new ApiError(
        422,
        "PAST_CHECK_IN",
        "Arrival cannot be earlier than today.",
        { checkIn: "Arrival cannot be earlier than today." },
      );
    }

    const nights = calculateNights(data.checkIn, data.checkOut);
    if (nights < 1) {
      throw new ApiError(
        422,
        "INVALID_DATES",
        "Departure must be at least one night after arrival.",
        { checkOut: "Departure must be at least one night after arrival." },
      );
    }

    const [conflicts] = await connection.query<RowDataPacket[]>(
      `SELECT id
         FROM bookings
        WHERE room_id = ?
          AND status = 'confirmed'
          AND check_in < ?
          AND check_out > ?
        LIMIT 1`,
      [Number(roomRow.id), data.checkOut, data.checkIn],
    );

    if (conflicts.length > 0) {
      throw new ApiError(
        409,
        "ROOM_UNAVAILABLE",
        "That apartment is already reserved for part of those dates. Please choose different dates or another apartment.",
        {
          checkIn: "These dates overlap an existing reservation.",
          checkOut: "These dates overlap an existing reservation.",
        },
      );
    }

    const requestedSlugs = Array.from(new Set(data.serviceSlugs));
    const services = await getServicesBySlugs(requestedSlugs, connection);

    if (services.length !== requestedSlugs.length) {
      const found = new Set(services.map((service) => service.slug));
      const missing = requestedSlugs.filter((slug) => !found.has(slug));
      throw new ApiError(
        422,
        "UNKNOWN_SERVICE",
        "One or more selected services are no longer available.",
        { serviceSlugs: `Unknown service: ${missing.join(", ")}.` },
      );
    }

    const roomTotal = round2(Number(roomRow.pricePerNight) * nights);

    const serviceLines = services.map((service) => ({
      service,
      amount: round2(serviceAmount(service, nights, data.guests)),
    }));

    const servicesTotal = round2(
      serviceLines.reduce((sum, line) => sum + line.amount, 0),
    );
    const total = round2(roomTotal + servicesTotal);
    const reference = generateBookingReference();

    const [insertResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO bookings
        (reference, room_id, check_in, check_out, guests, guest_name, guest_email,
         guest_phone, requests, nights, room_total, services_total, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [
        reference,
        Number(roomRow.id),
        data.checkIn,
        data.checkOut,
        data.guests,
        data.fullName,
        data.email,
        data.phone,
        data.requests ? data.requests : null,
        nights,
        roomTotal,
        servicesTotal,
        total,
      ],
    );

    const bookingId = Number(insertResult.insertId);

    for (const line of serviceLines) {
      await connection.query(
        `INSERT INTO booking_services
          (booking_id, service_id, quantity, unit_price, amount, status)
         VALUES (?, ?, 1, ?, ?, 'confirmed')`,
        [bookingId, Number(line.service.id), line.service.samplePrice, line.amount],
      );
    }

    await connection.commit();
    committed = true;

    const booking = await getBookingByReference(reference);
    if (!booking) {
      throw new ApiError(
        500,
        "BOOKING_READ_FAILED",
        `The booking was saved as ${reference} but could not be reloaded. Please keep this reference and try again.`,
      );
    }
    return booking;
  } catch (error) {
    if (!committed) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}

export async function getBookingByReference(
  reference: string,
): Promise<BookingRecord | null> {
  const pool = getPool();
  const [rows] = await pool.query<BookingRow[]>(
    `${BOOKING_SELECT} WHERE b.reference = ? LIMIT 1`,
    [reference],
  );

  const row = rows[0];
  if (!row) return null;

  const [serviceRows] = await pool.query<BookingServiceRow[]>(
    `${BOOKING_SERVICE_SELECT} WHERE bs.booking_id = ? ORDER BY bs.id ASC`,
    [Number(row.id)],
  );

  return mapBooking(row, serviceRows);
}

export async function listBookings(limit = 50): Promise<BookingRecord[]> {
  const pool = getPool();
  const [rows] = await pool.query<BookingRow[]>(
    `${BOOKING_SELECT} ORDER BY b.created_at DESC, b.id DESC LIMIT ?`,
    [limit],
  );

  if (rows.length === 0) return [];

  const bookingIds = rows.map((row) => Number(row.id));
  const [serviceRows] = await pool.query<BookingServiceRow[]>(
    `${BOOKING_SERVICE_SELECT} WHERE bs.booking_id IN (?) ORDER BY bs.id ASC`,
    [bookingIds],
  );

  const servicesByBooking = new Map<number, BookingServiceRow[]>();
  for (const serviceRow of serviceRows) {
    const list = servicesByBooking.get(Number(serviceRow.bookingId)) ?? [];
    list.push(serviceRow);
    servicesByBooking.set(Number(serviceRow.bookingId), list);
  }

  return rows.map((row) =>
    mapBooking(row, servicesByBooking.get(Number(row.id)) ?? []),
  );
}

function mapBooking(row: BookingRow, services: BookingServiceRow[]): BookingRecord {
  const roomTotal = Number(row.roomTotal);
  const servicesTotal = Number(row.servicesTotal);
  const nights = Number(row.nights);

  const lines: PriceLine[] = [
    {
      label: row.roomName,
      detail: `${formatUSD(Number(row.pricePerNight))} × ${nights} ${
        nights === 1 ? "night" : "nights"
      }`,
      amount: roomTotal,
    },
  ];

  for (const service of services) {
    if (service.status === "cancelled") continue;
    lines.push({
      label: service.name,
      detail: service.priceNote,
      amount: Number(service.amount),
    });
  }

  return {
    reference: row.reference,
    status: row.status,
    checkIn: row.checkIn,
    checkOut: row.checkOut,
    nights,
    guests: Number(row.guests),
    guest: {
      name: row.guestName,
      email: row.guestEmail,
      phone: row.guestPhone,
      requests: row.requests ?? "",
    },
    room: {
      slug: row.roomSlug,
      name: row.roomName,
      category: row.category,
      floor: toLevel(Number(row.floor)),
      pricePerNight: Number(row.pricePerNight),
    },
    services: services
      .filter((service) => service.status !== "cancelled")
      .map((service) => ({
        slug: service.slug,
        name: service.name,
        pricingType: service.pricingType,
        amount: Number(service.amount),
        status: service.status,
      })),
    price: {
      nights,
      subtotal: roomTotal,
      servicesTotal,
      total: Number(row.total),
      lines,
    },
    createdAt: row.createdAt,
  };
}

/**
 * Adds a service to an existing booking. Used by the services page for a real,
 * persisted service request.
 */
export async function addServiceToBooking(
  reference: string,
  serviceSlug: string,
): Promise<BookingRecord> {
  const pool = getPool();
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();

    const [bookingRows] = await connection.query<BookingRow[]>(
      `SELECT
         id, reference, nights, guests,
         room_total AS roomTotal, services_total AS servicesTotal, status
       FROM bookings
      WHERE reference = ?
      LIMIT 1 FOR UPDATE`,
      [reference],
    );

    const booking = bookingRows[0];
    if (!booking) {
      throw new ApiError(404, "BOOKING_NOT_FOUND", "No booking matches that reference.");
    }
    if (booking.status !== "confirmed") {
      throw new ApiError(409, "BOOKING_NOT_ACTIVE", "That booking is no longer active.");
    }

    const [serviceRows] = await connection.query<ServiceRow[]>(
      `${SERVICE_SELECT} WHERE slug = ? LIMIT 1`,
      [serviceSlug],
    );

    const serviceRow = serviceRows[0];
    if (!serviceRow) {
      throw new ApiError(404, "SERVICE_NOT_FOUND", "That service is not available.");
    }

    const [existing] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM booking_services WHERE booking_id = ? AND service_id = ? LIMIT 1`,
      [Number(booking.id), Number(serviceRow.id)],
    );

    if (existing.length > 0) {
      throw new ApiError(
        409,
        "SERVICE_ALREADY_REQUESTED",
        "That service is already attached to this booking.",
      );
    }

    const service = mapService(serviceRow);
    const amount = round2(serviceAmount(service, Number(booking.nights), Number(booking.guests)));
    const newServicesTotal = round2(Number(booking.servicesTotal) + amount);
    const newTotal = round2(Number(booking.roomTotal) + newServicesTotal);

    await connection.query(
      `INSERT INTO booking_services
        (booking_id, service_id, quantity, unit_price, amount, status)
       VALUES (?, ?, 1, ?, ?, 'requested')`,
      [Number(booking.id), Number(serviceRow.id), service.samplePrice, amount],
    );

    await connection.query(
      "UPDATE bookings SET services_total = ?, total = ? WHERE id = ?",
      [newServicesTotal, newTotal, Number(booking.id)],
    );

    await connection.commit();
    committed = true;

    const record = await getBookingByReference(reference);
    if (!record) {
      throw new ApiError(
        500,
        "BOOKING_READ_FAILED",
        "The service was requested but the booking could not be reloaded.",
      );
    }
    return record;
  } catch (error) {
    if (!committed) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}

/* ------------------------------------------------------------------------- */
/* Contact                                                                   */
/* ------------------------------------------------------------------------- */

export interface ContactMessageResult {
  id: number;
  receivedAt: string;
}

/** Persists a message submitted through the contact page. */
export async function createContactMessage(
  input: ContactMessageInput,
): Promise<ContactMessageResult> {
  const pool = getPool();
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO contact_messages (name, email, subject, message)
     VALUES (?, ?, ?, ?)`,
    [input.name, input.email, input.subject, input.message],
  );

  return {
    id: Number(result.insertId),
    receivedAt: new Date().toISOString(),
  };
}
