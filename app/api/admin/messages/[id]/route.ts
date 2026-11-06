import { connection, type NextRequest } from "next/server";
import { getAdminContactMessage, updateContactMessageStatus } from "@/lib/server/admin";
import { getClientIp, requireApiRole } from "@/lib/server/auth";
import { ApiError } from "@/lib/server/errors";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { parseContactMessageStatusBody, parseIdParam } from "@/lib/server/validation";

/** GET /api/admin/messages/[id] — message detail, notes and reply history. Auto-marks unread as read. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();
  try {
    await requireApiRole(["admin", "staff"]);
    const { id } = await params;
    const messageId = parseIdParam(id);

    const message = await getAdminContactMessage(messageId);
    if (!message) {
      throw new ApiError(404, "MESSAGE_NOT_FOUND", "No contact message found with that identifier.");
    }

    return jsonOk({ message });
  } catch (error) {
    return errorResponse(error);
  }
}

/** PATCH /api/admin/messages/[id] — update status (unread, read, handled, archived). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();
  try {
    assertSameOrigin(request);
    const user = await requireApiRole(["admin", "staff"]);
    const { id } = await params;
    const messageId = parseIdParam(id);
    const status = parseContactMessageStatusBody(await readJson(request));
    const ip = getClientIp(request);

    await updateContactMessageStatus(messageId, status, user, ip);
    return jsonOk({ ok: true, status, id: messageId });
  } catch (error) {
    return errorResponse(error);
  }
}
