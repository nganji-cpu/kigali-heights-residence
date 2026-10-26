import { connection, type NextRequest } from "next/server";
import { ApiError } from "@/lib/server/errors";
import { errorResponse, jsonOk, readJson } from "@/lib/server/http";
import {
  createBooking,
  getBookingByReference,
  listBookings,
} from "@/lib/server/repository";
import { parseBookingBody, parseReferenceParam } from "@/lib/server/validation";
import type { BookingSummary } from "@/types";

/**
 * POST /api/bookings
 * Validates the stay on the server, calculates every amount from database
 * prices, rejects overlapping confirmed bookings and persists the reservation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request);
    const input = parseBookingBody(body);
    const booking = await createBooking(input);
    return jsonOk({ booking }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * GET /api/bookings            — recent bookings (no contact details)
 * GET /api/bookings?reference= — one full booking, looked up by reference
 */
export async function GET(request: NextRequest) {
  await connection();
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");

    if (reference) {
      const booking = await getBookingByReference(parseReferenceParam(reference));
      if (!booking) {
        throw new ApiError(404, "BOOKING_NOT_FOUND", "No booking matches that reference.");
      }
      return jsonOk({ booking });
    }

    const limitParam = Number(searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(Math.trunc(limitParam), 1), 100)
      : 20;

    const bookings = await listBookings(limit);
    const summaries: BookingSummary[] = bookings.map((booking) => ({
      reference: booking.reference,
      status: booking.status,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      guests: booking.guests,
      room: booking.room,
      total: booking.price.total,
      createdAt: booking.createdAt,
    }));

    return jsonOk({ bookings: summaries, total: summaries.length });
  } catch (error) {
    return errorResponse(error);
  }
}
