import { connection, type NextRequest } from "next/server";
import { ApiError } from "@/lib/server/errors";
import { errorResponse, jsonOk } from "@/lib/server/http";
import { checkAvailability } from "@/lib/server/repository";
import { isValidISODate, serverTodayISO } from "@/lib/server/validation";

/**
 * GET /api/availability?roomSlug=penthouse-residence&checkIn=2026-11-10&checkOut=2026-11-13
 * Reports whether the room has no overlapping confirmed booking.
 */
export async function GET(request: NextRequest) {
  await connection();
  try {
    const searchParams = request.nextUrl.searchParams;
    const roomSlug = searchParams.get("roomSlug") ?? searchParams.get("room") ?? "";
    const checkIn = searchParams.get("checkIn") ?? "";
    const checkOut = searchParams.get("checkOut") ?? "";

    const fields: Record<string, string> = {};
    if (!roomSlug) fields.roomSlug = "A room slug is required.";
    if (!checkIn) {
      fields.checkIn = "An arrival date is required.";
    } else if (!isValidISODate(checkIn)) {
      fields.checkIn = "Arrival must be a valid date.";
    } else if (checkIn < serverTodayISO()) {
      fields.checkIn = "Arrival cannot be earlier than today.";
    }
    if (!checkOut) {
      fields.checkOut = "A departure date is required.";
    } else if (!isValidISODate(checkOut)) {
      fields.checkOut = "Departure must be a valid date.";
    } else if (isValidISODate(checkIn) && checkOut <= checkIn) {
      fields.checkOut = "Departure must be at least one night after arrival.";
    }

    if (Object.keys(fields).length > 0) {
      throw new ApiError(
        422,
        "VALIDATION_ERROR",
        "Please check the dates and room.",
        fields,
      );
    }

    const result = await checkAvailability(roomSlug, checkIn, checkOut);
    if (!result) {
      throw new ApiError(404, "ROOM_NOT_FOUND", "That apartment does not exist.");
    }

    return jsonOk(result);
  } catch (error) {
    return errorResponse(error);
  }
}
