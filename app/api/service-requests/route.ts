import type { NextRequest } from "next/server";
import { errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { addServiceToBooking } from "@/lib/server/repository";
import { parseServiceRequestBody } from "@/lib/server/validation";

/**
 * POST /api/service-requests
 * Body: { reference: "KHR-XXXXXXXX", serviceSlug: "airport-pickup" }
 *
 * Attaches a real, persisted service request to an existing booking and
 * recalculates the booking totals on the server.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request);
    const input = parseServiceRequestBody(body);
    const booking = await addServiceToBooking(input.reference, input.serviceSlug);
    return jsonOk({ booking }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
