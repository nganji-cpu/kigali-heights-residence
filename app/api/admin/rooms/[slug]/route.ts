import { connection, type NextRequest } from "next/server";
import { updateRoomStatus } from "@/lib/server/admin";
import { requireApiRole } from "@/lib/server/auth";
import { ApiError } from "@/lib/server/errors";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { parseRoomStatusBody } from "@/lib/server/validation";

/** PATCH /api/admin/rooms/[slug] — change an apartment's operational status. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  await connection();
  try {
    assertSameOrigin(request);
    await requireApiRole(["admin", "staff"]);
    const { slug } = await params;
    if (!slug || slug.length > 80) {
      throw new ApiError(400, "INVALID_ROOM", "That apartment is not valid.");
    }
    const status = parseRoomStatusBody(await readJson(request));
    await updateRoomStatus(slug, status);
    return jsonOk({ ok: true, status });
  } catch (error) {
    return errorResponse(error);
  }
}
