import "server-only";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import type {
  AdminReservationSummary,
  AdminStats,
  BookingStatus,
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
  ReportSummary,
  RoomReportRow,
} from "@/types";
import { ApiError } from "./errors";
import type { AdminReservationStatus, AdminRoomStatus, PaymentInput } from "./validation";

interface StatsRow extends RowDataPacket {
  totalReservations: number;
  pendingReservations: number;
  confirmedReservations: number;
  cancelledReservations: number;
  availableRooms: number;
  occupiedRooms: number;
  registeredCustomers: number;
  revenue: number;
}

export async function getAdminStats(): Promise<AdminStats> {
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
       (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') AS revenue`,
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
  };
}

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

export async function updateReservationStatus(
  reference: string,
  status: AdminReservationStatus,
): Promise<void> {
  const pool = getPool();
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<Array<RowDataPacket & { id: number }>>(
      "SELECT id FROM bookings WHERE reference = ? LIMIT 1 FOR UPDATE",
      [reference],
    );
    const booking = rows[0];
    if (!booking) {
      throw new ApiError(404, "BOOKING_NOT_FOUND", "No booking matches that reference.");
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
  } catch (error) {
    if (!committed) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

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

export async function updateRoomStatus(slug: string, status: AdminRoomStatus): Promise<void> {
  const pool = getPool();
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE rooms SET status = ? WHERE slug = ?",
    [status, slug],
  );
  if (Number(result.affectedRows) === 0) {
    throw new ApiError(404, "ROOM_NOT_FOUND", "That apartment does not exist.");
  }
}

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
