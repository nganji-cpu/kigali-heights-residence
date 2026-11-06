import { connection, type NextRequest } from "next/server";
import { addBookingReply } from "@/lib/server/admin";
import { getClientIp, requireApiRole } from "@/lib/server/auth";
import { getPool } from "@/lib/db";
import { ApiError } from "@/lib/server/errors";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { parseAdminReplyBody, parseReferenceParam } from "@/lib/server/validation";
import type { RowDataPacket } from "mysql2";

/** POST /api/admin/bookings/[reference]/reply — record persistent admin reply on a reservation. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> },
) {
  await connection();
  try {
    assertSameOrigin(request);
    const user = await requireApiRole(["admin", "staff"]);
    const { reference } = await params;
    const cleanRef = parseReferenceParam(reference);
    const input = parseAdminReplyBody(await readJson(request));
    const ip = getClientIp(request);

    const pool = getPool();
    const [rows] = await pool.query<Array<RowDataPacket & { id: number }>>(
      "SELECT id FROM bookings WHERE reference = ? LIMIT 1",
      [cleanRef],
    );
    const booking = rows[0];
    if (!booking) {
      throw new ApiError(404, "BOOKING_NOT_FOUND", "No booking matches that reference.");
    }

    const reply = await addBookingReply(Number(booking.id), input.message, user, ip);
    return jsonOk({ reply }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
