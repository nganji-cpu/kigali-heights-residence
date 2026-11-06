import { connection, type NextRequest } from "next/server";
import { endSession, getSessionUser } from "@/lib/server/auth";
import { logAdminActivity } from "@/lib/server/admin";
import { assertSameOrigin, errorResponse, jsonOk } from "@/lib/server/http";

/** POST /api/admin/auth/logout — invalidates the admin session row and clears the cookie. */
export async function POST(request: NextRequest) {
  await connection();
  try {
    assertSameOrigin(request);
    const user = await getSessionUser();
    if (user && (user.role === "admin" || user.role === "staff")) {
      await logAdminActivity({
        userId: user.id,
        action: "auth.logout",
        entityType: "user",
        entityId: String(user.id),
      });
    }
    await endSession();
    return jsonOk({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
