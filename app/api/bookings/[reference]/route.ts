import { connection, type NextRequest } from "next/server";
import { requireApiUser } from "@/lib/server/auth";
import { ApiError } from "@/lib/server/errors";
import { errorResponse, jsonOk } from "@/lib/server/http";
import { getBookingByReference, getBookingForUser } from "@/lib/server/repository";
import { parseReferenceParam } from "@/lib/server/validation";

/**
 * GET /api/bookings/[reference]
 *
 * Customers can only read their own reservation. Admin and staff can read any
 * reservation, including legacy rows created before customer accounts existed.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reference: string }> },
) {
  await connection();
  try {
    const user = await requireApiUser();
    const { reference } = await params;
    const parsed = parseReferenceParam(reference);

    const canSeeAll = user.role === "admin" || user.role === "staff";
    const booking = canSeeAll
      ? await getBookingByReference(parsed)
      : await getBookingForUser(user.id, parsed);

    if (!booking) {
      throw new ApiError(404, "BOOKING_NOT_FOUND", "No booking matches that reference.");
    }

    return jsonOk({ booking });
  } catch (error) {
    return errorResponse(error);
  }
}
