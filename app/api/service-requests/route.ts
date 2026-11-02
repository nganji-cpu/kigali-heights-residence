import { connection, type NextRequest } from "next/server";
import { requireApiUser } from "@/lib/server/auth";
import { ApiError } from "@/lib/server/errors";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { addServiceToBooking, getBookingForUser } from "@/lib/server/repository";
import { parseServiceRequestBody } from "@/lib/server/validation";

/**
 * POST /api/service-requests
 * Body: { reference: "KHR-XXXXXXXX", serviceSlug: "airport-pickup" }
 *
 * Requires sign-in. Customers may only add services to their own booking;
 * admin and staff may add services to any booking. Totals are recalculated on
 * the server.
 */
export async function POST(request: NextRequest) {
  await connection();
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const input = parseServiceRequestBody(await readJson(request));

    if (user.role === "customer") {
      const owned = await getBookingForUser(user.id, input.reference);
      if (!owned) {
        throw new ApiError(404, "BOOKING_NOT_FOUND", "No booking matches that reference.");
      }
    }

    const booking = await addServiceToBooking(input.reference, input.serviceSlug);
    return jsonOk({ booking }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
