import { connection, type NextRequest } from "next/server";
import { addAdminNote } from "@/lib/server/admin";
import { getClientIp, requireApiRole } from "@/lib/server/auth";
import { getPool } from "@/lib/db";
import { ApiError } from "@/lib/server/errors";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { parseAdminNoteBody } from "@/lib/server/validation";
import type { RowDataPacket } from "mysql2";

/** POST /api/admin/notes — save an internal administrator note. */
export async function POST(request: NextRequest) {
  await connection();
  try {
    assertSameOrigin(request);
    const user = await requireApiRole(["admin", "staff"]);
    const input = parseAdminNoteBody(await readJson(request));
    const ip = getClientIp(request);

    let bookingId: number | undefined = undefined;
    if (input.bookingReference) {
      const pool = getPool();
      const [rows] = await pool.query<Array<RowDataPacket & { id: number }>>(
        "SELECT id FROM bookings WHERE reference = ? LIMIT 1",
        [input.bookingReference],
      );
      if (rows.length === 0) {
        throw new ApiError(404, "BOOKING_NOT_FOUND", "No booking matches that reference.");
      }
      bookingId = Number(rows[0].id);
    }

    const note = await addAdminNote(
      {
        note: input.note,
        bookingId,
        contactMessageId: input.contactMessageId,
        clientUserId: input.clientUserId,
      },
      user,
      ip,
    );

    return jsonOk({ note }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
