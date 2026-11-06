import "server-only";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import type {
  AdminActivityLogRecord,
  AdminClientSummary,
  AdminNoteRecord,
  AdminReplyRecord,
  AdminReservationSummary,
  AdminServiceRequestSummary,
  AdminStats,
  AuthUser,
  BookingRecord,
  BookingServiceStatus,
  BookingStatus,
  ContactMessageRecord,
  ContactMessageStatus,
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
  ReportSummary,
  RoomReportRow,
  ServiceCategory,
  UserRole,
  UserStatus,
} from "@/types";
import { ApiError } from "./errors";
import { getBookingByReference } from "./repository";
import type {
  AdminReservationStatus,
  AdminRoomStatus,
  ContactMessageStatusInput,
  PaymentInput,
  ServiceRequestStatusInput,
} from "./validation";

/* ------------------------------------------------------------------------- */
/* Activity Logging                                                          */
/* ------------------------------------------------------------------------- */

export interface LogActivityParams {
  userId: number;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export async function logAdminActivity(params: LogActivityParams): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(
      `INSERT INTO admin_activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        params.userId,
        params.action,
        params.entityType,
        params.entityId,
        params.details ? JSON.stringify(params.details) : null,
        params.ipAddress ?? null,
      ],
    );
  } catch (error) {
    console.warn("Could not write admin activity log:", error);
  }
}

interface ActivityLogRow extends RowDataPacket {
  id: number;
  userId: number;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export async function listAdminActivity(limit = 15): Promise<AdminActivityLogRecord[]> {
  try {
    const pool = getPool();
    const [rows] = await pool.query<ActivityLogRow[]>(
      `SELECT
         l.id,
         l.user_id AS userId,
         u.full_name AS userName,
         u.role AS userRole,
         l.action,
         l.entity_type AS entityType,
         l.entity_id AS entityId,
         l.details,
         l.ip_address AS ipAddress,
         l.created_at AS createdAt
       FROM admin_activity_logs l
       JOIN users u ON u.id = l.user_id
       ORDER BY l.created_at DESC, l.id DESC
       LIMIT ?`,
      [limit],
    );

    return rows.map((row) => {
      let parsedDetails: Record<string, unknown> | null = null;
      if (row.details) {
        try {
          parsedDetails = typeof row.details === "string" ? JSON.parse(row.details) : row.details;
        } catch {
          parsedDetails = null;
        }
      }
      return {
        id: Number(row.id),
        userId: Number(row.userId),
        userName: row.userName,
        userRole: row.userRole,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        details: parsedDetails,
        ipAddress: row.ipAddress,
        createdAt: row.createdAt,
      };
    });
  } catch (error) {
    console.warn("Database unavailable during listAdminActivity:", error);
    return [];
  }
}

/* ------------------------------------------------------------------------- */
/* Statistics and Overview                                                   */
/* ------------------------------------------------------------------------- */

interface StatsRow extends RowDataPacket {
  totalReservations: number;
  pendingReservations: number;
  confirmedReservations: number;
  cancelledReservations: number;
  availableRooms: number;
  occupiedRooms: number;
  registeredCustomers: number;
  revenue: number;
  unreadMessages: number;
  pendingServiceRequests: number;
  upcomingCheckIns: number;
  upcomingCheckOuts: number;
  totalUniqueClients: number;
}

export async function getAdminStats(): Promise<AdminStats & {
  unreadMessages: number;
  pendingServiceRequests: number;
  upcomingCheckIns: number;
  upcomingCheckOuts: number;
  totalUniqueClients: number;
}> {
  const pool = getPool();
  const [rows] = await pool.query<StatsRow[]>(
    `SELECT
       (SELECT COUNT(*) FROM bookings) AS totalReservations,
       (SELECT COUNT(*) FROM bookings WHERE status = 'pending') AS pendingReservations,
       (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') AS confirmedReservations,
       (SELECT COUNT(*) FROM bookings WHERE status = 'cancelled') AS cancelledReservations,
       (SELECT COUNT(*) FROM rooms WHERE status = 'available') AS availableRooms,
       (SELECT COUNT(*) FROM rooms WHERE status = 'occupied') AS occupiedRooms,
       (SELECT COUNT(*) FROM users WHERE role = 'customer') AS registeredCustomers,
       (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') AS revenue,
       (SELECT COUNT(*) FROM contact_messages WHERE status = 'unread') AS unreadMessages,
       (SELECT COUNT(*) FROM booking_services WHERE status = 'requested') AS pendingServiceRequests,
       (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND check_in >= CURDATE() AND check_in <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AS upcomingCheckIns,
       (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND check_out >= CURDATE() AND check_out <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AS upcomingCheckOuts,
       (SELECT COUNT(DISTINCT email) FROM (
          SELECT email FROM users WHERE role = 'customer'
          UNION
          SELECT guest_email AS email FROM bookings
        ) AS clients) AS totalUniqueClients`,
  );

  const row = rows[0];
  return {
    totalReservations: Number(row?.totalReservations ?? 0),
    pendingReservations: Number(row?.pendingReservations ?? 0),
    confirmedReservations: Number(row?.confirmedReservations ?? 0),
    cancelledReservations: Number(row?.cancelledReservations ?? 0),
    availableRooms: Number(row?.availableRooms ?? 0),
    occupiedRooms: Number(row?.occupiedRooms ?? 0),
    registeredCustomers: Number(row?.registeredCustomers ?? 0),
    revenue: Number(row?.revenue ?? 0),
    unreadMessages: Number(row?.unreadMessages ?? 0),
    pendingServiceRequests: Number(row?.pendingServiceRequests ?? 0),
    upcomingCheckIns: Number(row?.upcomingCheckIns ?? 0),
    upcomingCheckOuts: Number(row?.upcomingCheckOuts ?? 0),
    totalUniqueClients: Number(row?.totalUniqueClients ?? 0),
  };
}

/* ------------------------------------------------------------------------- */
/* Reservations                                                              */
/* ------------------------------------------------------------------------- */

interface AdminReservationRow extends RowDataPacket {
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
  createdAt: string;
}

export interface ReservationFilters {
  status?: BookingStatus | "all";
  roomSlug?: string;
  search?: string;
  limit?: number;
}

export async function listAdminReservations(
  filters: ReservationFilters = {},
): Promise<AdminReservationSummary[]> {
  const pool = getPool();
  const where: string[] = [];
  const params: Array<string | number> = [];

  if (filters.status && filters.status !== "all") {
    where.push("b.status = ?");
    params.push(filters.status);
  }
  if (filters.roomSlug) {
    where.push("r.slug = ?");
    params.push(filters.roomSlug);
  }
  if (filters.search) {
    where.push("(b.reference LIKE ? OR b.guest_name LIKE ? OR b.guest_email LIKE ?)");
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 300);
  params.push(limit);

  const [rows] = await pool.query<AdminReservationRow[]>(
    `SELECT
       b.reference,
       b.status,
       b.user_id AS customerId,
       b.guest_name AS guestName,
       b.guest_email AS guestEmail,
       b.guest_phone AS guestPhone,
       r.name AS roomName,
       r.slug AS roomSlug,
       b.check_in AS checkIn,
       b.check_out AS checkOut,
       b.nights,
       b.guests,
       b.total,
       COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) AS paidTotal,
       b.created_at AS createdAt
     FROM bookings b
     JOIN rooms r ON r.id = b.room_id
     LEFT JOIN payments p ON p.booking_id = b.id
     ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
     GROUP BY b.id
     ORDER BY b.created_at DESC, b.id DESC
     LIMIT ?`,
    params,
  );

  return rows.map((row) => {
    const total = Number(row.total);
    const paidTotal = Number(row.paidTotal);
    return {
      reference: row.reference,
      status: row.status,
      customerId: row.customerId === null ? null : Number(row.customerId),
      guestName: row.guestName,
      guestEmail: row.guestEmail,
      guestPhone: row.guestPhone,
      roomName: row.roomName,
      roomSlug: row.roomSlug,
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      nights: Number(row.nights),
      guests: Number(row.guests),
      total,
      paidTotal,
      balance: Math.round((total - paidTotal) * 100) / 100,
      createdAt: row.createdAt,
    };
  });
}

export async function getAdminUpcomingArrivals(limit = 6): Promise<AdminReservationSummary[]> {
  const pool = getPool();
  const [rows] = await pool.query<AdminReservationRow[]>(
    `SELECT
       b.reference,
       b.status,
       b.user_id AS customerId,
       b.guest_name AS guestName,
       b.guest_email AS guestEmail,
       b.guest_phone AS guestPhone,
       r.name AS roomName,
       r.slug AS roomSlug,
       b.check_in AS checkIn,
       b.check_out AS checkOut,
       b.nights,
       b.guests,
       b.total,
       COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) AS paidTotal,
       b.created_at AS createdAt
     FROM bookings b
     JOIN rooms r ON r.id = b.room_id
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE b.status = 'confirmed' AND b.check_in >= CURDATE()
     GROUP BY b.id
     ORDER BY b.check_in ASC
     LIMIT ?`,
    [limit],
  );

  return rows.map((row) => {
    const total = Number(row.total);
    const paidTotal = Number(row.paidTotal);
    return {
      reference: row.reference,
      status: row.status,
      customerId: row.customerId === null ? null : Number(row.customerId),
      guestName: row.guestName,
      guestEmail: row.guestEmail,
      guestPhone: row.guestPhone,
      roomName: row.roomName,
      roomSlug: row.roomSlug,
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      nights: Number(row.nights),
      guests: Number(row.guests),
      total,
      paidTotal,
      balance: Math.round((total - paidTotal) * 100) / 100,
      createdAt: row.createdAt,
    };
  });
}

export async function getAdminUpcomingDepartures(limit = 6): Promise<AdminReservationSummary[]> {
  const pool = getPool();
  const [rows] = await pool.query<AdminReservationRow[]>(
    `SELECT
       b.reference,
       b.status,
       b.user_id AS customerId,
       b.guest_name AS guestName,
       b.guest_email AS guestEmail,
       b.guest_phone AS guestPhone,
       r.name AS roomName,
       r.slug AS roomSlug,
       b.check_in AS checkIn,
       b.check_out AS checkOut,
       b.nights,
       b.guests,
       b.total,
       COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) AS paidTotal,
       b.created_at AS createdAt
     FROM bookings b
     JOIN rooms r ON r.id = b.room_id
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE b.status = 'confirmed' AND b.check_out >= CURDATE()
     GROUP BY b.id
     ORDER BY b.check_out ASC
     LIMIT ?`,
    [limit],
  );

  return rows.map((row) => {
    const total = Number(row.total);
    const paidTotal = Number(row.paidTotal);
    return {
      reference: row.reference,
      status: row.status,
      customerId: row.customerId === null ? null : Number(row.customerId),
      guestName: row.guestName,
      guestEmail: row.guestEmail,
      guestPhone: row.guestPhone,
      roomName: row.roomName,
      roomSlug: row.roomSlug,
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      nights: Number(row.nights),
      guests: Number(row.guests),
      total,
      paidTotal,
      balance: Math.round((total - paidTotal) * 100) / 100,
      createdAt: row.createdAt,
    };
  });
}

export interface DetailedBookingRecord {
  booking: BookingRecord;
  bookingId: number;
  payments: PaymentRecord[];
  notes: AdminNoteRecord[];
  replies: AdminReplyRecord[];
}

export async function getDetailedBookingByReference(
  reference: string,
): Promise<DetailedBookingRecord | null> {
  const booking = await getBookingByReference(reference);
  if (!booking) return null;

  const pool = getPool();
  const [idRows] = await pool.query<Array<RowDataPacket & { id: number }>>(
    "SELECT id FROM bookings WHERE reference = ? LIMIT 1",
    [reference],
  );
  const bookingId = Number(idRows[0]?.id);

  const [payments, notes, replies] = await Promise.all([
    listPaymentsForBooking(reference),
    listNotesForBooking(bookingId),
    listRepliesForBooking(bookingId),
  ]);

  return {
    booking,
    bookingId,
    payments,
    notes,
    replies,
  };
}

export async function updateReservationStatus(
  reference: string,
  status: AdminReservationStatus,
  adminUser?: AuthUser,
  ipAddress?: string,
): Promise<void> {
  const pool = getPool();
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<
      Array<RowDataPacket & { id: number; room_id: number; check_in: string; check_out: string; status: BookingStatus }>
    >(
      "SELECT id, room_id, check_in, check_out, status FROM bookings WHERE reference = ? LIMIT 1 FOR UPDATE",
      [reference],
    );
    const booking = rows[0];
    if (!booking) {
      throw new ApiError(404, "BOOKING_NOT_FOUND", "No booking matches that reference.");
    }

    // Critical transactional overlap check:
    // If transitioning to 'confirmed', verify no other booking for this room is confirmed on overlapping dates
    if (status === "confirmed" && booking.status !== "confirmed") {
      const [conflicts] = await connection.query<
        Array<RowDataPacket & { id: number; reference: string; check_in: string; check_out: string }>
      >(
        `SELECT id, reference, check_in, check_out
           FROM bookings
          WHERE room_id = ?
            AND status = 'confirmed'
            AND id <> ?
            AND check_in < ?
            AND check_out > ?
          LIMIT 1 FOR UPDATE`,
        [booking.room_id, booking.id, booking.check_out, booking.check_in],
      );

      if (conflicts.length > 0) {
        const conflict = conflicts[0];
        throw new ApiError(
          409,
          "ROOM_UNAVAILABLE",
          `Cannot confirm reservation: Apartment already has a confirmed booking (${conflict.reference}) from ${conflict.check_in} to ${conflict.check_out}.`,
        );
      }
    }

    await connection.query(
      `UPDATE bookings
          SET status = ?,
              confirmed_at = CASE WHEN ? = 'confirmed' THEN COALESCE(confirmed_at, NOW()) ELSE confirmed_at END,
              cancelled_at = CASE WHEN ? = 'cancelled' THEN COALESCE(cancelled_at, NOW()) ELSE NULL END
        WHERE id = ?`,
      [status, status, status, Number(booking.id)],
    );

    if (status === "confirmed") {
      await connection.query(
        "UPDATE booking_services SET status = 'confirmed' WHERE booking_id = ? AND status = 'requested'",
        [Number(booking.id)],
      );
    } else if (status === "cancelled") {
      await connection.query(
        "UPDATE booking_services SET status = 'cancelled' WHERE booking_id = ? AND status <> 'cancelled'",
        [Number(booking.id)],
      );
    }

    await connection.commit();
    committed = true;

    if (adminUser) {
      await logAdminActivity({
        userId: adminUser.id,
        action: `booking.status.${status}`,
        entityType: "booking",
        entityId: reference,
        details: { previousStatus: booking.status, newStatus: status },
        ipAddress,
      });
    }
  } catch (error) {
    if (!committed) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/* ------------------------------------------------------------------------- */
/* Contact Messages                                                          */
/* ------------------------------------------------------------------------- */

interface ContactMessageRow extends RowDataPacket {
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
}

export interface ContactMessageFilters {
  status?: string;
  subject?: string;
  search?: string;
  limit?: number;
}

export async function listAdminContactMessages(
  filters: ContactMessageFilters = {},
): Promise<ContactMessageRecord[]> {
  const pool = getPool();
  const where: string[] = [];
  const params: Array<string | number> = [];

  if (filters.status && filters.status !== "all") {
    where.push("status = ?");
    params.push(filters.status);
  }
  if (filters.subject && filters.subject !== "all") {
    where.push("subject = ?");
    params.push(filters.subject);
  }
  if (filters.search) {
    where.push("(name LIKE ? OR email LIKE ? OR message LIKE ?)");
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 300);
  params.push(limit);

  const [rows] = await pool.query<ContactMessageRow[]>(
    `SELECT
       id, name, email, subject, message, status,
       read_at AS readAt,
       handled_at AS handledAt,
       archived_at AS archivedAt,
       created_at AS createdAt
     FROM contact_messages
     ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    params,
  );

  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    status: row.status,
    readAt: row.readAt,
    handledAt: row.handledAt,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
  }));
}

export async function getAdminContactMessage(id: number): Promise<ContactMessageRecord | null> {
  const pool = getPool();
  const [rows] = await pool.query<ContactMessageRow[]>(
    `SELECT
       id, name, email, subject, message, status,
       read_at AS readAt,
       handled_at AS handledAt,
       archived_at AS archivedAt,
       created_at AS createdAt
     FROM contact_messages
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  const row = rows[0];
  if (!row) return null;

  // Auto-mark unread as read when opened
  if (row.status === "unread") {
    await pool.query(
      "UPDATE contact_messages SET status = 'read', read_at = NOW() WHERE id = ?",
      [id],
    );
    row.status = "read";
    row.readAt = new Date().toISOString();
  }

  const [replies, notes] = await Promise.all([
    listRepliesForMessage(id),
    listNotesForMessage(id),
  ]);

  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    status: row.status,
    readAt: row.readAt,
    handledAt: row.handledAt,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    replies,
    notes,
  };
}

export async function updateContactMessageStatus(
  id: number,
  status: ContactMessageStatusInput,
  adminUser?: AuthUser,
  ipAddress?: string,
): Promise<void> {
  const pool = getPool();
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE contact_messages
        SET status = ?,
            read_at = CASE WHEN ? IN ('read', 'handled') THEN COALESCE(read_at, NOW()) ELSE read_at END,
            handled_at = CASE WHEN ? = 'handled' THEN COALESCE(handled_at, NOW()) ELSE handled_at END,
            archived_at = CASE WHEN ? = 'archived' THEN COALESCE(archived_at, NOW()) ELSE NULL END
      WHERE id = ?`,
    [status, status, status, status, id],
  );

  if (Number(result.affectedRows) === 0) {
    throw new ApiError(404, "MESSAGE_NOT_FOUND", "No contact message found with that identifier.");
  }

  if (adminUser) {
    await logAdminActivity({
      userId: adminUser.id,
      action: `message.status.${status}`,
      entityType: "contact_message",
      entityId: String(id),
      details: { newStatus: status },
      ipAddress,
    });
  }
}

export async function addContactMessageReply(
  contactMessageId: number,
  message: string,
  adminUser: AuthUser,
  ipAddress?: string,
): Promise<AdminReplyRecord> {
  const pool = getPool();
  const [msgRows] = await pool.query<ContactMessageRow[]>(
    "SELECT id, email, name FROM contact_messages WHERE id = ? LIMIT 1",
    [contactMessageId],
  );
  const msg = msgRows[0];
  if (!msg) {
    throw new ApiError(404, "MESSAGE_NOT_FOUND", "No contact message matches that identifier.");
  }

  const [insert] = await pool.query<ResultSetHeader>(
    `INSERT INTO admin_replies
      (contact_message_id, sender_type, user_id, sender_name, sender_email, message, is_read, read_at)
     VALUES (?, 'admin', ?, ?, ?, ?, 1, NOW())`,
    [
      contactMessageId,
      adminUser.id,
      adminUser.fullName,
      adminUser.email,
      message,
    ],
  );

  // Automatically update message status to 'handled'
  await pool.query(
    "UPDATE contact_messages SET status = 'handled', handled_at = NOW() WHERE id = ?",
    [contactMessageId],
  );

  await logAdminActivity({
    userId: adminUser.id,
    action: "message.reply",
    entityType: "contact_message",
    entityId: String(contactMessageId),
    details: { recipientEmail: msg.email },
    ipAddress,
  });

  return {
    id: Number(insert.insertId),
    contactMessageId,
    senderType: "admin",
    userId: adminUser.id,
    senderName: adminUser.fullName,
    senderEmail: adminUser.email,
    message,
    isRead: true,
    readAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------------- */
/* Service Requests                                                          */
/* ------------------------------------------------------------------------- */

interface ServiceRequestRow extends RowDataPacket {
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

export interface ServiceRequestFilters {
  status?: string;
  search?: string;
  limit?: number;
}

export async function listAdminServiceRequests(
  filters: ServiceRequestFilters = {},
): Promise<AdminServiceRequestSummary[]> {
  const pool = getPool();
  const where: string[] = [];
  const params: Array<string | number> = [];

  if (filters.status && filters.status !== "all") {
    where.push("bs.status = ?");
    params.push(filters.status);
  }
  if (filters.search) {
    where.push("(b.reference LIKE ? OR b.guest_name LIKE ? OR s.name LIKE ?)");
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 300);
  params.push(limit);

  const [rows] = await pool.query<ServiceRequestRow[]>(
    `SELECT
       bs.id,
       bs.booking_id AS bookingId,
       b.reference AS bookingReference,
       b.guest_name AS guestName,
       b.guest_email AS guestEmail,
       s.id AS serviceId,
       s.slug AS serviceSlug,
       s.name AS serviceName,
       s.category AS serviceCategory,
       bs.quantity,
       bs.unit_price AS unitPrice,
       bs.amount,
       bs.status,
       bs.notes,
       bs.created_at AS createdAt,
       bs.updated_at AS updatedAt
     FROM booking_services bs
     JOIN bookings b ON b.id = bs.booking_id
     JOIN services s ON s.id = bs.service_id
     ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY bs.created_at DESC, bs.id DESC
     LIMIT ?`,
    params,
  );

  return rows.map((row) => ({
    id: Number(row.id),
    bookingId: Number(row.bookingId),
    bookingReference: row.bookingReference,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    serviceId: Number(row.serviceId),
    serviceSlug: row.serviceSlug,
    serviceName: row.serviceName,
    serviceCategory: row.serviceCategory,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unitPrice),
    amount: Number(row.amount),
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function updateAdminServiceRequestStatus(
  id: number,
  status: ServiceRequestStatusInput,
  notes?: string,
  adminUser?: AuthUser,
  ipAddress?: string,
): Promise<void> {
  const pool = getPool();
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<
      Array<RowDataPacket & { booking_id: number; amount: number; status: BookingServiceStatus }>
    >(
      "SELECT booking_id, amount, status FROM booking_services WHERE id = ? LIMIT 1 FOR UPDATE",
      [id],
    );
    const serviceReq = rows[0];
    if (!serviceReq) {
      throw new ApiError(404, "SERVICE_REQUEST_NOT_FOUND", "Service request not found.");
    }

    await connection.query(
      `UPDATE booking_services
          SET status = ?,
              notes = COALESCE(?, notes)
        WHERE id = ?`,
      [status, notes ?? null, id],
    );

    // Recalculate booking services_total and total if status changed to/from cancelled
    const [bookingRows] = await connection.query<
      Array<RowDataPacket & { id: number; reference: string; room_total: number }>
    >(
      "SELECT id, reference, room_total FROM bookings WHERE id = ? LIMIT 1 FOR UPDATE",
      [serviceReq.booking_id],
    );
    const booking = bookingRows[0];

    if (booking) {
      const [sumRows] = await connection.query<Array<RowDataPacket & { services_total: number }>>(
        `SELECT COALESCE(SUM(amount), 0) AS services_total
           FROM booking_services
          WHERE booking_id = ? AND status <> 'cancelled'`,
        [booking.id],
      );
      const newServicesTotal = Number(sumRows[0]?.services_total ?? 0);
      const newTotal = Math.round((Number(booking.room_total) + newServicesTotal) * 100) / 100;

      await connection.query(
        "UPDATE bookings SET services_total = ?, total = ? WHERE id = ?",
        [newServicesTotal, newTotal, booking.id],
      );
    }

    await connection.commit();
    committed = true;

    if (adminUser) {
      await logAdminActivity({
        userId: adminUser.id,
        action: `service_request.status.${status}`,
        entityType: "booking_service",
        entityId: String(id),
        details: { newStatus: status, notes },
        ipAddress,
      });
    }
  } catch (error) {
    if (!committed) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/* ------------------------------------------------------------------------- */
/* Notes and Communication Helpers                                           */
/* ------------------------------------------------------------------------- */

interface NoteRow extends RowDataPacket {
  id: number;
  userId: number;
  userName: string;
  bookingId: number | null;
  contactMessageId: number | null;
  clientUserId: number | null;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export async function addAdminNote(
  input: { note: string; bookingId?: number; contactMessageId?: number; clientUserId?: number },
  adminUser: AuthUser,
  ipAddress?: string,
): Promise<AdminNoteRecord> {
  const pool = getPool();
  const [insert] = await pool.query<ResultSetHeader>(
    `INSERT INTO admin_notes (user_id, booking_id, contact_message_id, client_user_id, note)
     VALUES (?, ?, ?, ?, ?)`,
    [
      adminUser.id,
      input.bookingId ?? null,
      input.contactMessageId ?? null,
      input.clientUserId ?? null,
      input.note,
    ],
  );

  const noteId = Number(insert.insertId);

  await logAdminActivity({
    userId: adminUser.id,
    action: "note.create",
    entityType: input.bookingId ? "booking" : input.contactMessageId ? "contact_message" : "client",
    entityId: String(input.bookingId || input.contactMessageId || input.clientUserId || noteId),
    details: { noteLength: input.note.length },
    ipAddress,
  });

  return {
    id: noteId,
    userId: adminUser.id,
    userName: adminUser.fullName,
    bookingId: input.bookingId ?? null,
    contactMessageId: input.contactMessageId ?? null,
    clientUserId: input.clientUserId ?? null,
    note: input.note,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function addBookingReply(
  bookingId: number,
  message: string,
  adminUser: AuthUser,
  ipAddress?: string,
): Promise<AdminReplyRecord> {
  const pool = getPool();
  const [rows] = await pool.query<Array<RowDataPacket & { reference: string; guest_email: string }>>(
    "SELECT reference, guest_email FROM bookings WHERE id = ? LIMIT 1",
    [bookingId],
  );
  const booking = rows[0];
  if (!booking) {
    throw new ApiError(404, "BOOKING_NOT_FOUND", "No booking matches that identifier.");
  }

  const [insert] = await pool.query<ResultSetHeader>(
    `INSERT INTO admin_replies
      (booking_id, sender_type, user_id, sender_name, sender_email, message, is_read, read_at)
     VALUES (?, 'admin', ?, ?, ?, ?, 1, NOW())`,
    [bookingId, adminUser.id, adminUser.fullName, adminUser.email, message],
  );

  await logAdminActivity({
    userId: adminUser.id,
    action: "booking.reply",
    entityType: "booking",
    entityId: booking.reference,
    details: { recipientEmail: booking.guest_email },
    ipAddress,
  });

  return {
    id: Number(insert.insertId),
    bookingId,
    senderType: "admin",
    userId: adminUser.id,
    senderName: adminUser.fullName,
    senderEmail: adminUser.email,
    message,
    isRead: true,
    readAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export async function listNotesForBooking(bookingId: number): Promise<AdminNoteRecord[]> {
  const pool = getPool();
  const [rows] = await pool.query<NoteRow[]>(
    `SELECT
       n.id, n.user_id AS userId, u.full_name AS userName,
       n.booking_id AS bookingId, n.contact_message_id AS contactMessageId,
       n.client_user_id AS clientUserId, n.note,
       n.created_at AS createdAt, n.updated_at AS updatedAt
     FROM admin_notes n
     JOIN users u ON u.id = n.user_id
     WHERE n.booking_id = ?
     ORDER BY n.created_at DESC`,
    [bookingId],
  );

  return rows.map((r) => ({
    id: Number(r.id),
    userId: Number(r.userId),
    userName: r.userName,
    bookingId: r.bookingId,
    contactMessageId: r.contactMessageId,
    clientUserId: r.clientUserId,
    note: r.note,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function listNotesForMessage(contactMessageId: number): Promise<AdminNoteRecord[]> {
  const pool = getPool();
  const [rows] = await pool.query<NoteRow[]>(
    `SELECT
       n.id, n.user_id AS userId, u.full_name AS userName,
       n.booking_id AS bookingId, n.contact_message_id AS contactMessageId,
       n.client_user_id AS clientUserId, n.note,
       n.created_at AS createdAt, n.updated_at AS updatedAt
     FROM admin_notes n
     JOIN users u ON u.id = n.user_id
     WHERE n.contact_message_id = ?
     ORDER BY n.created_at DESC`,
    [contactMessageId],
  );

  return rows.map((r) => ({
    id: Number(r.id),
    userId: Number(r.userId),
    userName: r.userName,
    bookingId: r.bookingId,
    contactMessageId: r.contactMessageId,
    clientUserId: r.clientUserId,
    note: r.note,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

interface ReplyRow extends RowDataPacket {
  id: number;
  contactMessageId: number | null;
  bookingId: number | null;
  senderType: "customer" | "admin" | "staff";
  userId: number | null;
  senderName: string;
  senderEmail: string;
  message: string;
  isRead: number;
  readAt: string | null;
  createdAt: string;
}

export async function listRepliesForBooking(bookingId: number): Promise<AdminReplyRecord[]> {
  const pool = getPool();
  const [rows] = await pool.query<ReplyRow[]>(
    `SELECT
       id, contact_message_id AS contactMessageId, booking_id AS bookingId,
       sender_type AS senderType, user_id AS userId,
       sender_name AS senderName, sender_email AS senderEmail,
       message, is_read AS isRead, read_at AS readAt,
       created_at AS createdAt
     FROM admin_replies
     WHERE booking_id = ?
     ORDER BY created_at ASC`,
    [bookingId],
  );

  return rows.map((r) => ({
    id: Number(r.id),
    contactMessageId: r.contactMessageId,
    bookingId: r.bookingId,
    senderType: r.senderType,
    userId: r.userId,
    senderName: r.senderName,
    senderEmail: r.senderEmail,
    message: r.message,
    isRead: Boolean(r.isRead),
    readAt: r.readAt,
    createdAt: r.createdAt,
  }));
}

export async function listRepliesForMessage(contactMessageId: number): Promise<AdminReplyRecord[]> {
  const pool = getPool();
  const [rows] = await pool.query<ReplyRow[]>(
    `SELECT
       id, contact_message_id AS contactMessageId, booking_id AS bookingId,
       sender_type AS senderType, user_id AS userId,
       sender_name AS senderName, sender_email AS senderEmail,
       message, is_read AS isRead, read_at AS readAt,
       created_at AS createdAt
     FROM admin_replies
     WHERE contact_message_id = ?
     ORDER BY created_at ASC`,
    [contactMessageId],
  );

  return rows.map((r) => ({
    id: Number(r.id),
    contactMessageId: r.contactMessageId,
    bookingId: r.bookingId,
    senderType: r.senderType,
    userId: r.userId,
    senderName: r.senderName,
    senderEmail: r.senderEmail,
    message: r.message,
    isRead: Boolean(r.isRead),
    readAt: r.readAt,
    createdAt: r.createdAt,
  }));
}

/* ------------------------------------------------------------------------- */
/* Clients Directory (derived from actual bookings and customer accounts)    */
/* ------------------------------------------------------------------------- */

interface ClientRow extends RowDataPacket {
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

export async function listAdminClients(search?: string): Promise<AdminClientSummary[]> {
  const pool = getPool();
  const searchClause = search
    ? "HAVING (fullName LIKE ? OR email LIKE ? OR phone LIKE ?)"
    : "";
  const params: string[] = [];
  if (search) {
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  // Aggregate registered customers and guest bookings without creating duplicates
  const [rows] = await pool.query<ClientRow[]>(
    `SELECT
       COALESCE(u.id, 0) AS id,
       COALESCE(u.full_name, b_agg.lead_name) AS fullName,
       c_emails.email AS email,
       COALESCE(u.phone, b_agg.lead_phone, '') AS phone,
       COALESCE(u.status, 'active') AS status,
       COALESCE(u.created_at, b_agg.first_booking, NOW()) AS createdAt,
       COALESCE(b_agg.reservation_count, 0) AS totalReservations,
       COALESCE(b_agg.active_count, 0) AS activeReservations,
       b_agg.latest_booking AS latestReservationDate,
       COALESCE(b_agg.total_spent, 0) AS totalSpent
     FROM (
       SELECT email FROM users WHERE role = 'customer'
       UNION
       SELECT guest_email AS email FROM bookings
     ) AS c_emails
     LEFT JOIN users u ON u.email = c_emails.email AND u.role = 'customer'
     LEFT JOIN (
       SELECT
         guest_email,
         MIN(guest_name) AS lead_name,
         MIN(guest_phone) AS lead_phone,
         MIN(created_at) AS first_booking,
         MAX(created_at) AS latest_booking,
         COUNT(id) AS reservation_count,
         SUM(CASE WHEN status IN ('pending', 'confirmed') THEN 1 ELSE 0 END) AS active_count,
         SUM(CASE WHEN status IN ('pending', 'confirmed') THEN total ELSE 0 END) AS total_spent
       FROM bookings
       GROUP BY guest_email
     ) AS b_agg ON b_agg.guest_email = c_emails.email
     ${searchClause}
     ORDER BY totalReservations DESC, totalSpent DESC`,
    params,
  );

  return rows.map((r) => ({
    id: Number(r.id),
    fullName: r.fullName,
    email: r.email,
    phone: r.phone,
    status: r.status,
    createdAt: r.createdAt,
    totalReservations: Number(r.totalReservations),
    activeReservations: Number(r.activeReservations),
    latestReservationDate: r.latestReservationDate,
    totalSpent: Number(r.totalSpent),
  }));
}

export interface ClientProfileRecord {
  client: AdminClientSummary;
  reservations: AdminReservationSummary[];
  messages: ContactMessageRecord[];
  notes: AdminNoteRecord[];
}

export async function getAdminClientProfile(email: string): Promise<ClientProfileRecord | null> {
  const clients = await listAdminClients(email);
  const client = clients.find((c) => c.email.toLowerCase() === email.toLowerCase());
  if (!client) return null;

  const pool = getPool();

  const [reservationRows] = await pool.query<AdminReservationRow[]>(
    `SELECT
       b.reference, b.status, b.user_id AS customerId,
       b.guest_name AS guestName, b.guest_email AS guestEmail, b.guest_phone AS guestPhone,
       r.name AS roomName, r.slug AS roomSlug,
       b.check_in AS checkIn, b.check_out AS checkOut,
       b.nights, b.guests, b.total,
       COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) AS paidTotal,
       b.created_at AS createdAt
     FROM bookings b
     JOIN rooms r ON r.id = b.room_id
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE b.guest_email = ?
     GROUP BY b.id
     ORDER BY b.created_at DESC`,
    [email],
  );

  const reservations: AdminReservationSummary[] = reservationRows.map((row) => ({
    reference: row.reference,
    status: row.status,
    customerId: row.customerId === null ? null : Number(row.customerId),
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    guestPhone: row.guestPhone,
    roomName: row.roomName,
    roomSlug: row.roomSlug,
    checkIn: row.checkIn,
    checkOut: row.checkOut,
    nights: Number(row.nights),
    guests: Number(row.guests),
    total: Number(row.total),
    paidTotal: Number(row.paidTotal),
    balance: Math.round((Number(row.total) - Number(row.paidTotal)) * 100) / 100,
    createdAt: row.createdAt,
  }));

  const messages = await listAdminContactMessages({ search: email, limit: 50 });

  const [noteRows] = await pool.query<NoteRow[]>(
    `SELECT
       n.id, n.user_id AS userId, u.full_name AS userName,
       n.booking_id AS bookingId, n.contact_message_id AS contactMessageId,
       n.client_user_id AS clientUserId, n.note,
       n.created_at AS createdAt, n.updated_at AS updatedAt
     FROM admin_notes n
     JOIN users u ON u.id = n.user_id
     WHERE n.client_user_id = ?
     ORDER BY n.created_at DESC`,
    [client.id],
  );

  const notes: AdminNoteRecord[] = noteRows.map((r) => ({
    id: Number(r.id),
    userId: Number(r.userId),
    userName: r.userName,
    bookingId: r.bookingId,
    contactMessageId: r.contactMessageId,
    clientUserId: r.clientUserId,
    note: r.note,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  return {
    client,
    reservations,
    messages,
    notes,
  };
}

/* ------------------------------------------------------------------------- */
/* Payments                                                                  */
/* ------------------------------------------------------------------------- */

interface PaymentRow extends RowDataPacket {
  id: number;
  bookingReference: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionReference: string | null;
  paidAt: string | null;
  recordedByName: string | null;
  notes: string | null;
  createdAt: string;
}

const PAYMENT_SELECT = `
  SELECT
    p.id,
    b.reference AS bookingReference,
    p.amount,
    p.method,
    p.status,
    p.transaction_reference AS transactionReference,
    p.paid_at AS paidAt,
    u.full_name AS recordedByName,
    p.notes,
    p.created_at AS createdAt
  FROM payments p
  JOIN bookings b ON b.id = p.booking_id
  LEFT JOIN users u ON u.id = p.recorded_by_user_id
`;

function mapPayment(row: PaymentRow): PaymentRecord {
  return {
    id: Number(row.id),
    bookingReference: row.bookingReference,
    amount: Number(row.amount),
    method: row.method,
    status: row.status,
    transactionReference: row.transactionReference ?? "",
    paidAt: row.paidAt,
    recordedByName: row.recordedByName,
    notes: row.notes ?? "",
    createdAt: row.createdAt,
  };
}

export async function listPayments(limit = 100): Promise<PaymentRecord[]> {
  const pool = getPool();
  const [rows] = await pool.query<PaymentRow[]>(
    `${PAYMENT_SELECT} ORDER BY p.created_at DESC, p.id DESC LIMIT ?`,
    [limit],
  );
  return rows.map(mapPayment);
}

export async function listPaymentsForBooking(reference: string): Promise<PaymentRecord[]> {
  const pool = getPool();
  const [rows] = await pool.query<PaymentRow[]>(
    `${PAYMENT_SELECT} WHERE b.reference = ? ORDER BY p.created_at DESC, p.id DESC`,
    [reference],
  );
  return rows.map(mapPayment);
}

export async function recordPayment(
  input: PaymentInput,
  recordedByUserId: number,
  ipAddress?: string,
): Promise<PaymentRecord> {
  const pool = getPool();
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<
      Array<RowDataPacket & { id: number; total: number; status: BookingStatus }>
    >(
      `SELECT id, total, status FROM bookings WHERE reference = ? LIMIT 1 FOR UPDATE`,
      [input.bookingReference],
    );
    const booking = rows[0];
    if (!booking) {
      throw new ApiError(404, "BOOKING_NOT_FOUND", "No booking matches that reference.");
    }
    if (booking.status === "cancelled") {
      throw new ApiError(409, "BOOKING_CANCELLED", "Payments cannot be recorded against a cancelled booking.");
    }

    const [paidRows] = await connection.query<Array<RowDataPacket & { paid: number }>>(
      `SELECT COALESCE(SUM(amount), 0) AS paid
         FROM payments
        WHERE booking_id = ? AND status = 'completed'`,
      [Number(booking.id)],
    );
    const paid = Number(paidRows[0]?.paid ?? 0);
    const balance = Math.round((Number(booking.total) - paid) * 100) / 100;

    if (input.status === "completed" && input.amount > balance + 0.005) {
      throw new ApiError(
        422,
        "PAYMENT_EXCEEDS_BALANCE",
        `That amount exceeds the outstanding balance of ${balance.toFixed(2)} USD.`,
        { amount: `The outstanding balance is ${balance.toFixed(2)} USD.` },
      );
    }

    const paidAt =
      input.status === "completed" ? (input.paidAt ? input.paidAt.replace("T", " ") : null) : null;

    const [inserted] = await connection.query<ResultSetHeader>(
      `INSERT INTO payments
        (booking_id, amount, method, status, transaction_reference, paid_at,
         recorded_by_user_id, notes)
       VALUES (?, ?, ?, ?, ?, COALESCE(?, NOW()), ?, ?)`,
      [
        Number(booking.id),
        input.amount,
        input.method,
        input.status,
        input.transactionReference || null,
        paidAt,
        recordedByUserId,
        input.notes || null,
      ],
    );

    await connection.commit();
    committed = true;

    await logAdminActivity({
      userId: recordedByUserId,
      action: "payment.record",
      entityType: "payment",
      entityId: input.bookingReference,
      details: { amount: input.amount, method: input.method, status: input.status },
      ipAddress,
    });

    const [paymentRows] = await pool.query<PaymentRow[]>(
      `${PAYMENT_SELECT} WHERE p.id = ? LIMIT 1`,
      [Number(inserted.insertId)],
    );
    const payment = paymentRows[0];
    if (!payment) {
      throw new ApiError(500, "PAYMENT_READ_FAILED", "The payment was saved but could not be reloaded.");
    }
    return mapPayment(payment);
  } catch (error) {
    if (!committed) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/* ------------------------------------------------------------------------- */
/* Room Status Management                                                    */
/* ------------------------------------------------------------------------- */

export async function updateRoomStatus(
  slug: string,
  status: AdminRoomStatus,
  adminUser?: AuthUser,
  ipAddress?: string,
): Promise<void> {
  const pool = getPool();
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE rooms SET status = ? WHERE slug = ?",
    [status, slug],
  );
  if (Number(result.affectedRows) === 0) {
    throw new ApiError(404, "ROOM_NOT_FOUND", "That apartment does not exist.");
  }

  if (adminUser) {
    await logAdminActivity({
      userId: adminUser.id,
      action: `room.status.${status}`,
      entityType: "room",
      entityId: slug,
      details: { status },
      ipAddress,
    });
  }
}

/* ------------------------------------------------------------------------- */
/* Reports                                                                   */
/* ------------------------------------------------------------------------- */

interface PeriodRow extends RowDataPacket {
  period: string;
  reservations: number;
  revenue: number;
}

interface StatusRow extends RowDataPacket {
  status: BookingStatus;
  count: number;
}

interface RoomReportDbRow extends RowDataPacket {
  roomName: string;
  reservations: number;
  revenue: number;
}

interface CustomerReportRow extends RowDataPacket {
  label: string;
  value: number;
}

export async function getReportSummary(): Promise<ReportSummary> {
  const pool = getPool();

  const [periodRows] = await pool.query<PeriodRow[]>(
    `SELECT
       DATE_FORMAT(created_at, '%Y-%m') AS period,
       COUNT(*) AS reservations,
       COALESCE(SUM(total), 0) AS revenue
     FROM bookings
     WHERE status IN ('pending', 'confirmed')
       AND created_at >= DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL 5 MONTH)
     GROUP BY period
     ORDER BY period ASC`,
  );

  const [statusRows] = await pool.query<StatusRow[]>(
    `SELECT status, COUNT(*) AS count FROM bookings GROUP BY status`,
  );

  const [revenueRows] = await pool.query<Array<RowDataPacket & { revenue: number }>>(
    `SELECT COALESCE(SUM(amount), 0) AS revenue FROM payments WHERE status = 'completed'`,
  );

  const [roomRows] = await pool.query<RoomReportDbRow[]>(
    `SELECT
       r.name AS roomName,
       COUNT(b.id) AS reservations,
       COALESCE(SUM(b.total), 0) AS revenue
     FROM rooms r
     LEFT JOIN bookings b ON b.room_id = r.id AND b.status IN ('pending', 'confirmed')
     GROUP BY r.id
     ORDER BY revenue DESC, r.name ASC`,
  );

  const [customerRows] = await pool.query<CustomerReportRow[]>(
    `SELECT
       u.full_name AS label,
       COALESCE(SUM(b.total), 0) AS value
     FROM users u
     JOIN bookings b ON b.user_id = u.id AND b.status IN ('pending', 'confirmed')
     WHERE u.role = 'customer'
     GROUP BY u.id
     ORDER BY value DESC
     LIMIT 5`,
  );

  const periodMap = new Map(periodRows.map((row) => [row.period, row]));
  const months: ReportSummary["periodRows"] = [];
  const now = new Date();
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const row = periodMap.get(key);
    months.push({
      period: key,
      reservations: Number(row?.reservations ?? 0),
      revenue: Number(row?.revenue ?? 0),
    });
  }

  const roomReport: RoomReportRow[] = roomRows.map((row) => ({
    roomName: row.roomName,
    reservations: Number(row.reservations),
    revenue: Number(row.revenue),
  }));

  return {
    periodRows: months,
    statusRows: statusRows.map((row) => ({ status: row.status, count: Number(row.count) })),
    revenue: Number(revenueRows[0]?.revenue ?? 0),
    roomRows: roomReport,
    customerRows: customerRows.map((row) => ({
      label: row.label,
      value: Number(row.value),
    })),
  };
}
