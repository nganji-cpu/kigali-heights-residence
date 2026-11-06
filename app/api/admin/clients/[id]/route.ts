import { connection, type NextRequest } from "next/server";
import { getAdminClientProfile } from "@/lib/server/admin";
import { requireApiRole } from "@/lib/server/auth";
import { ApiError } from "@/lib/server/errors";
import { errorResponse, jsonOk } from "@/lib/server/http";

/** GET /api/admin/clients/[id] — customer profile with booking history, messages and internal notes. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();
  try {
    await requireApiRole(["admin", "staff"]);
    const { id } = await params;
    const emailParam = decodeURIComponent(id).trim();

    const profile = await getAdminClientProfile(emailParam);
    if (!profile) {
      throw new ApiError(404, "CLIENT_NOT_FOUND", "No client profile found for that identifier.");
    }

    return jsonOk({ profile });
  } catch (error) {
    return errorResponse(error);
  }
}
