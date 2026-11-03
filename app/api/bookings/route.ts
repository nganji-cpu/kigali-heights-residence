import { connection, type NextRequest } from "next/server";
import { requireApiUser } from "@/lib/server/auth";
import { ApiError } from "@/lib/server/errors";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import {
  createBooking,
  getBookingByReference,
  getBookingForUser,
  listBookings,
  listBookingsForUser,
} from "@/lib/server/repository";
import { parseBookingBody, parseReferenceParam } from "@/lib/server/validation";
import type { BookingRecord, BookingSummary } from "@/types";

function toSummary(booking: BookingRecord): BookingSummary {
  return {
    reference: booking.reference,
    status: booking.status,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    guests: booking.guests,
    room: booking.room,
    total: booking.price.total,
    createdAt: booking.createdAt,
  };
}

/**
 * POST /api/bookings
 *
 * Requires a signed-in customer. The account identity always wins over the
 * request body, so a browser cannot book on behalf of another person. Every
 * amount is recalculated from database prices and new bookings start `pending`
 * until the residence team confirms them.
 */
export async function POST(request: NextRequest) {
  await connection();
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    if (user.role !== "customer") {
      throw new ApiError(
        403,
        "CUSTOMER_ONLY",
        "Reservations are created from customer accounts. Admin and staff can manage them in the portal.",
      );
    }

    const input = parseBookingBody(await readJson(request));
    const booking = await createBooking({
      ...input,
      email: user.email,
      userId: user.id,
    });
    return jsonOk({ booking }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * GET /api/bookings
 *   customers — only their own reservations
 *   admin/staff — every reservation
 *
 * GET /api/bookings?reference=… applies the same ownership rule.
 */
export async function GET(request: NextRequest) {
  await connection();
  try {
    const user = await requireApiUser();
    const canSeeAll = user.role === "admin" || user.role === "staff";
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");

    if (reference) {
      const parsed = parseReferenceParam(reference);
      const booking = canSeeAll
        ? await getBookingByReference(parsed)
        : await getBookingForUser(user.id, parsed);

      if (!booking) {
        throw new ApiError(404, "BOOKING_NOT_FOUND", "No booking matches that reference.");
      }
      return jsonOk({ booking });
    }

    const limitParam = Number(searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(Math.trunc(limitParam), 1), 100)
      : 20;

    const bookings = canSeeAll
      ? await listBookings(limit)
      : await listBookingsForUser(user.id, limit);
    const summaries = bookings.map(toSummary);

    return jsonOk({ bookings: summaries, total: summaries.length });
  } catch (error) {
    return errorResponse(error);
  }
}
