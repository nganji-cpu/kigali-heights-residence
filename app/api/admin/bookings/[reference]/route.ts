import { connection, type NextRequest } from "next/server";
import { getDetailedBookingByReference, updateReservationStatus } from "@/lib/server/admin";
import { getClientIp, requireApiRole } from "@/lib/server/auth";
import { ApiError } from "@/lib/server/errors";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { parseReferenceParam, parseReservationStatusBody } from "@/lib/server/validation";

/** GET /api/admin/bookings/[reference] — full reservation details, payments, notes & replies. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reference: string }> },
) {
  await connection();
  try {
    await requireApiRole(["admin", "staff"]);
    const { reference } = await params;
    const cleanRef = parseReferenceParam(reference);
    const details = await getDetailedBookingByReference(cleanRef);
    if (!details) {
      throw new ApiError(404, "BOOKING_NOT_FOUND", "No reservation matches that reference.");
    }
    return jsonOk({ bookingDetails: details });
  } catch (error) {
    return errorResponse(error);
  }
}

/** PATCH /api/admin/bookings/[reference] — update status with overlap conflict check and logging. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> },
) {
  await connection();
  try {
    assertSameOrigin(request);
    const user = await requireApiRole(["admin", "staff"]);
    const { reference } = await params;
    const cleanRef = parseReferenceParam(reference);
    const status = parseReservationStatusBody(await readJson(request));
    const ip = getClientIp(request);

    await updateReservationStatus(cleanRef, status, user, ip);
    return jsonOk({ ok: true, status, reference: cleanRef });
  } catch (error) {
    return errorResponse(error);
  }
}
