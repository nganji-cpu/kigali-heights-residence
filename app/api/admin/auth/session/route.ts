import { connection } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { errorResponse, jsonOk } from "@/lib/server/http";

/** GET /api/admin/auth/session — returns current authenticated admin/staff, or `{ user: null }`. */
export async function GET() {
  await connection();
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return jsonOk({ user: null });
    }
    return jsonOk({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
