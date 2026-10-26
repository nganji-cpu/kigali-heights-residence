import { connection, type NextRequest } from "next/server";
import { ApiError } from "@/lib/server/errors";
import { errorResponse, jsonOk } from "@/lib/server/http";
import { getBookingByReference } from "@/lib/server/repository";
import { parseReferenceParam } from "@/lib/server/validation";

/** GET /api/bookings/[reference] — a single booking with its services and totals. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reference: string }> },
) {
  await connection();
  try {
    const { reference } = await params;
    const booking = await getBookingByReference(parseReferenceParam(reference));

    if (!booking) {
      throw new ApiError(404, "BOOKING_NOT_FOUND", "No booking matches that reference.");
    }

    return jsonOk({ booking });
  } catch (error) {
    return errorResponse(error);
  }
}
