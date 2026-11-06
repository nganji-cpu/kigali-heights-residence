import { connection, type NextRequest } from "next/server";
import { updateReservationStatus } from "@/lib/server/admin";
import { getClientIp, requireApiRole } from "@/lib/server/auth";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { parseReferenceParam, parseReservationStatusBody } from "@/lib/server/validation";

/** PATCH /api/admin/reservations/[reference] — confirm, reopen or cancel with overlap check. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> },
) {
  await connection();
  try {
    assertSameOrigin(request);
    const user = await requireApiRole(["admin", "staff"]);
    const { reference } = await params;
    const status = parseReservationStatusBody(await readJson(request));
    const ip = getClientIp(request);
    await updateReservationStatus(parseReferenceParam(reference), status, user, ip);
    return jsonOk({ ok: true, status });
  } catch (error) {
    return errorResponse(error);
  }
}
