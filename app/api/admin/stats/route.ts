import { connection } from "next/server";
import { getAdminStats } from "@/lib/server/admin";
import { requireApiRole } from "@/lib/server/auth";
import { errorResponse, jsonOk } from "@/lib/server/http";

/** GET /api/admin/stats — headline figures for the operations dashboard. */
export async function GET() {
  await connection();
  try {
    await requireApiRole(["admin", "staff"]);
    const stats = await getAdminStats();
    return jsonOk({ stats });
  } catch (error) {
    return errorResponse(error);
  }
}
