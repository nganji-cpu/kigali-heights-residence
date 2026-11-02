import { connection, type NextRequest } from "next/server";
import { deleteUserSessions, findUserById, updateUserStatus } from "@/lib/server/accounts";
import { requireApiRole } from "@/lib/server/auth";
import { ApiError } from "@/lib/server/errors";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { parseIdParam, parseStaffStatusBody } from "@/lib/server/validation";

/**
 * PATCH /api/admin/staff/[id] — activate, deactivate or suspend a team member.
 * Admin-only, and an admin cannot change their own status (which would lock
 * them out). The role itself cannot be changed through this endpoint.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();
  try {
    assertSameOrigin(request);
    const actingUser = await requireApiRole(["admin"]);
    const { id } = await params;
    const targetId = parseIdParam(id);

    if (targetId === actingUser.id) {
      throw new ApiError(
        422,
        "CANNOT_CHANGE_OWN_STATUS",
        "You cannot change the status of your own account.",
      );
    }

    const target = await findUserById(targetId);
    if (!target || target.role === "customer") {
      throw new ApiError(404, "ACCOUNT_NOT_FOUND", "That team account no longer exists.");
    }

    const status = parseStaffStatusBody(await readJson(request));
    const updated = await updateUserStatus(targetId, status);

    if (status !== "active") {
      await deleteUserSessions(targetId);
    }

    return jsonOk({ user: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
