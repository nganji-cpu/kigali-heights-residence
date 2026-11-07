import { connection, type NextRequest } from "next/server";
import { addContactMessageReply } from "@/lib/server/admin";
import { getClientIp, requireApiRole } from "@/lib/server/auth";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { notifyContactMessageReply, runInBackground } from "@/lib/server/notifications";
import { parseAdminReplyBody, parseIdParam } from "@/lib/server/validation";

/** POST /api/admin/messages/[id]/reply — record persistent admin reply and mark message handled. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();
  try {
    assertSameOrigin(request);
    const user = await requireApiRole(["admin", "staff"]);
    const { id } = await params;
    const messageId = parseIdParam(id);
    const input = parseAdminReplyBody(await readJson(request));
    const ip = getClientIp(request);

    const reply = await addContactMessageReply(messageId, input.message, user, ip);
    runInBackground(() =>
      notifyContactMessageReply({ messageId, message: input.message, staffName: user.fullName }),
    );
    return jsonOk({ reply }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
