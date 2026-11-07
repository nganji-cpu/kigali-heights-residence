import { connection, type NextRequest } from "next/server";
import { updateAdminServiceRequestStatus } from "@/lib/server/admin";
import { getClientIp, requireApiRole } from "@/lib/server/auth";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { parseIdParam, parseServiceRequestUpdateBody } from "@/lib/server/validation";

/** PATCH /api/admin/service-requests/[id] — update status (requested, confirmed, cancelled) with notes. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();
  try {
    assertSameOrigin(request);
    const user = await requireApiRole(["admin", "staff"]);
    const { id } = await params;
    const serviceRequestId = parseIdParam(id);
    const input = parseServiceRequestUpdateBody(await readJson(request));
    const ip = getClientIp(request);

    await updateAdminServiceRequestStatus(serviceRequestId, input.status, input.notes, user, ip);
    return jsonOk({ ok: true, status: input.status, id: serviceRequestId });
  } catch (error) {
    return errorResponse(error);
  }
}
