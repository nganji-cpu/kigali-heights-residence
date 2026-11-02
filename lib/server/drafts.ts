import "server-only";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { calculateNights } from "@/lib/booking";
import { formatUSD } from "@/lib/utils";
import type { DraftResumeResult, DraftWarning, ReservationDraft, RoomStatus } from "@/types";
import { ApiError } from "./errors";
import { checkAvailability } from "./repository";
import { serverTodayISO, type DraftInput } from "./validation";

interface DraftRow extends RowDataPacket {
  id: number;
  roomId: number | null;
  roomSlug: string | null;
  roomName: string | null;
  roomStatus: RoomStatus | null;
  roomCapacity: number | null;
  checkIn: string | null;
  checkOut: string | null;
  guests: number;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  requests: string | null;
  currentStep: number;
  roomPriceSnapshot: number | null;
  roomPrice: number | null;
  updatedAt: string;
}

interface DraftServiceRow extends RowDataPacket {
  draftId: number;
  slug: string;
  name: string;
  priceSnapshot: number | null;
  samplePrice: number;
}

const DRAFT_SELECT = `
  SELECT
    d.id,
    d.room_id AS roomId,
    r.slug AS roomSlug,
    r.name AS roomName,
    r.status AS roomStatus,
    r.capacity AS roomCapacity,
    d.check_in AS checkIn,
    d.check_out AS checkOut,
    d.guests,
    d.guest_name AS guestName,
    d.guest_email AS guestEmail,
    d.guest_phone AS guestPhone,
    d.requests,
    d.current_step AS currentStep,
    d.room_price_snapshot AS roomPriceSnapshot,
    r.price_per_night AS roomPrice,
    d.updated_at AS updatedAt
  FROM reservation_drafts d
  LEFT JOIN rooms r ON r.id = d.room_id
`;

function mapDraft(row: DraftRow, serviceSlugs: string[]): ReservationDraft {
  return {
    id: Number(row.id),
    roomSlug: row.roomSlug,
    roomName: row.roomName,
    checkIn: row.checkIn ?? "",
    checkOut: row.checkOut ?? "",
    guests: Number(row.guests),
    fullName: row.guestName ?? "",
    email: row.guestEmail ?? "",
    phone: row.guestPhone ?? "",
    requests: row.requests ?? "",
    currentStep: Number(row.currentStep),
    serviceSlugs,
    updatedAt: row.updatedAt,
  };
}

async function servicesForDrafts(draftIds: number[]): Promise<Map<number, string[]>> {
  const result = new Map<number, string[]>();
  if (draftIds.length === 0) return result;

  const pool = getPool();
  const [rows] = await pool.query<DraftServiceRow[]>(
    `SELECT ds.draft_id AS draftId, s.slug
       FROM reservation_draft_services ds
       JOIN services s ON s.id = ds.service_id
      WHERE ds.draft_id IN (?)
      ORDER BY s.name ASC`,
    [draftIds],
  );

  for (const row of rows) {
    const list = result.get(Number(row.draftId)) ?? [];
    list.push(row.slug);
    result.set(Number(row.draftId), list);
  }
  return result;
}

export async function listDraftsForUser(userId: number): Promise<ReservationDraft[]> {
  const pool = getPool();
  const [rows] = await pool.query<DraftRow[]>(
    `${DRAFT_SELECT} WHERE d.user_id = ? ORDER BY d.updated_at DESC`,
    [userId],
  );

  if (rows.length === 0) return [];
  const services = await servicesForDrafts(rows.map((row) => Number(row.id)));
  return rows.map((row) => mapDraft(row, services.get(Number(row.id)) ?? []));
}

export async function getDraftForUser(
  userId: number,
  draftId: number,
): Promise<ReservationDraft | null> {
  const pool = getPool();
  const [rows] = await pool.query<DraftRow[]>(
    `${DRAFT_SELECT} WHERE d.id = ? AND d.user_id = ? LIMIT 1`,
    [draftId, userId],
  );

  const row = rows[0];
  if (!row) return null;
  const services = await servicesForDrafts([Number(row.id)]);
  return mapDraft(row, services.get(Number(row.id)) ?? []);
}

export async function getLatestDraftForUser(userId: number): Promise<ReservationDraft | null> {
  const pool = getPool();
  const [rows] = await pool.query<DraftRow[]>(
    `${DRAFT_SELECT} WHERE d.user_id = ? ORDER BY d.updated_at DESC LIMIT 1`,
    [userId],
  );
  const row = rows[0];
  if (!row) return null;
  const services = await servicesForDrafts([Number(row.id)]);
  return mapDraft(row, services.get(Number(row.id)) ?? []);
}

export async function saveDraft(userId: number, input: DraftInput): Promise<ReservationDraft> {
  const pool = getPool();
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();

    let roomId: number | null = null;
    let roomPrice: number | null = null;

    if (input.roomSlug) {
      const [roomRows] = await connection.query<
        Array<RowDataPacket & { id: number; pricePerNight: number }>
      >(
        `SELECT id, price_per_night AS pricePerNight FROM rooms WHERE slug = ? LIMIT 1`,
        [input.roomSlug],
      );
      const room = roomRows[0];
      if (!room) {
        throw new ApiError(422, "UNKNOWN_ROOM", "That apartment no longer exists.", {
          roomSlug: "That apartment no longer exists.",
        });
      }
      roomId = Number(room.id);
      roomPrice = Number(room.pricePerNight);
    }

    let draftId = input.id;
    if (draftId !== null) {
      const [ownedRows] = await connection.query<RowDataPacket[]>(
        "SELECT id FROM reservation_drafts WHERE id = ? AND user_id = ? LIMIT 1",
        [draftId, userId],
      );
      if (ownedRows.length === 0) {
        throw new ApiError(404, "DRAFT_NOT_FOUND", "That reservation draft was not found.");
      }

      await connection.query(
        `UPDATE reservation_drafts
            SET room_id = ?,
                check_in = ?,
                check_out = ?,
                guests = ?,
                guest_name = ?,
                guest_email = ?,
                guest_phone = ?,
                requests = ?,
                current_step = ?,
                room_price_snapshot = ?
          WHERE id = ? AND user_id = ?`,
        [
          roomId,
          input.checkIn || null,
          input.checkOut || null,
          input.guests,
          input.fullName || null,
          input.email || null,
          input.phone || null,
          input.requests || null,
          input.currentStep,
          roomPrice,
          draftId,
          userId,
        ],
      );
    } else {
      const [inserted] = await connection.query<ResultSetHeader>(
        `INSERT INTO reservation_drafts
          (user_id, room_id, check_in, check_out, guests, guest_name, guest_email,
           guest_phone, requests, current_step, room_price_snapshot)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          roomId,
          input.checkIn || null,
          input.checkOut || null,
          input.guests,
          input.fullName || null,
          input.email || null,
          input.phone || null,
          input.requests || null,
          input.currentStep,
          roomPrice,
        ],
      );
      draftId = Number(inserted.insertId);
    }

    await connection.query("DELETE FROM reservation_draft_services WHERE draft_id = ?", [draftId]);

    if (input.serviceSlugs.length > 0) {
      const [serviceRows] = await connection.query<
        Array<RowDataPacket & { id: number; slug: string; samplePrice: number }>
      >(
        `SELECT id, slug, sample_price AS samplePrice FROM services WHERE slug IN (?)`,
        [input.serviceSlugs],
      );

      for (const service of serviceRows) {
        await connection.query(
          `INSERT INTO reservation_draft_services (draft_id, service_id, price_snapshot)
           VALUES (?, ?, ?)`,
          [draftId, Number(service.id), Number(service.samplePrice)],
        );
      }
    }

    await connection.commit();
    committed = true;

    const draft = await getDraftForUser(userId, draftId);
    if (!draft) {
      throw new ApiError(500, "DRAFT_READ_FAILED", "The draft was saved but could not be reloaded.");
    }
    return draft;
  } catch (error) {
    if (!committed) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function discardDraft(userId: number, draftId: number): Promise<void> {
  const pool = getPool();
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM reservation_drafts WHERE id = ? AND user_id = ?",
    [draftId, userId],
  );
  if (Number(result.affectedRows) === 0) {
    throw new ApiError(404, "DRAFT_NOT_FOUND", "That reservation draft was not found.");
  }
}

/**
 * Re-checks a saved draft against current prices, dates, availability, capacity
 * and service catalogue. Nothing is silently changed: every difference becomes
 * an explicit warning the customer can read before continuing.
 */
export async function resumeDraft(
  userId: number,
  draftId: number,
): Promise<DraftResumeResult> {
  const pool = getPool();
  const [rows] = await pool.query<DraftRow[]>(
    `${DRAFT_SELECT} WHERE d.id = ? AND d.user_id = ? LIMIT 1`,
    [draftId, userId],
  );

  const row = rows[0];
  if (!row) {
    throw new ApiError(404, "DRAFT_NOT_FOUND", "That reservation draft was not found.");
  }

  const [serviceRows] = await pool.query<DraftServiceRow[]>(
    `SELECT ds.draft_id AS draftId, s.slug, s.name, ds.price_snapshot AS priceSnapshot,
            s.sample_price AS samplePrice
       FROM reservation_draft_services ds
       JOIN services s ON s.id = ds.service_id
      WHERE ds.draft_id = ?
      ORDER BY s.name ASC`,
    [draftId],
  );

  const warnings: DraftWarning[] = [];
  const serviceSlugs: string[] = [];

  if (!row.roomId || !row.roomSlug) {
    warnings.push({
      field: "room",
      message: "The saved apartment is no longer in the catalogue. Please choose another.",
    });
  } else if (row.roomStatus !== "available") {
    warnings.push({
      field: "room",
      message: `${row.roomName} is currently marked ${row.roomStatus}. Please choose another apartment.`,
    });
  }

  if (row.roomPrice !== null && row.roomPriceSnapshot !== null) {
    const oldPrice = Number(row.roomPriceSnapshot);
    const newPrice = Number(row.roomPrice);
    if (Math.abs(oldPrice - newPrice) > 0.005) {
      warnings.push({
        field: "price",
        message: `The nightly rate for ${row.roomName} changed from ${formatUSD(oldPrice)} to ${formatUSD(newPrice)}. Your total has been recalculated.`,
      });
    }
  }

  const today = serverTodayISO();
  if (!row.checkIn || !row.checkOut) {
    warnings.push({
      field: "dates",
      message: "Your saved stay did not include both dates. Please choose them again.",
    });
  } else {
    if (row.checkIn < today) {
      warnings.push({
        field: "dates",
        message: "Your saved arrival date has passed. Please choose new dates.",
      });
    }
    if (row.checkOut <= row.checkIn) {
      warnings.push({
        field: "dates",
        message: "Your saved departure date is no longer after arrival. Please choose new dates.",
      });
    }
  }

  if (row.roomCapacity !== null && row.guests > Number(row.roomCapacity)) {
    warnings.push({
      field: "guests",
      message: `${row.roomName} sleeps up to ${row.roomCapacity} guests. Please reduce the party size or choose a larger apartment.`,
    });
  }

  if (row.roomId && row.checkIn && row.checkOut && row.checkOut > row.checkIn && row.checkIn >= today) {
    const availability = await checkAvailability(row.roomSlug ?? "", row.checkIn, row.checkOut);
    if (availability && !availability.available) {
      warnings.push({
        field: "dates",
        message: "Those dates are no longer available for this apartment. Please choose different dates.",
      });
    }
  }

  for (const service of serviceRows) {
    serviceSlugs.push(service.slug);
    if (service.priceSnapshot !== null) {
      const oldPrice = Number(service.priceSnapshot);
      const newPrice = Number(service.samplePrice);
      if (Math.abs(oldPrice - newPrice) > 0.005) {
        warnings.push({
          field: "price",
          message: `${service.name} is now priced from ${formatUSD(newPrice)} (was ${formatUSD(oldPrice)}).`,
        });
      }
    }
  }

  if (row.checkIn && row.checkOut) {
    const nights = calculateNights(row.checkIn, row.checkOut);
    if (nights < 1) {
      warnings.push({
        field: "dates",
        message: "A stay must be at least one night. Please adjust your dates.",
      });
    }
  }

  return { draft: mapDraft(row, serviceSlugs), warnings };
}
