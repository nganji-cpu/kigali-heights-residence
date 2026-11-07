import { connection, type NextRequest } from "next/server";
import { listAdminServiceRequests } from "@/lib/server/admin";
import { requireApiRole } from "@/lib/server/auth";
import { errorResponse, jsonOk } from "@/lib/server/http";

/** GET /api/admin/service-requests — list all service requests with guest, booking, and pricing details. */
export async function GET(request: NextRequest) {
  await connection();
  try {
    await requireApiRole(["admin", "staff"]);
    const searchParams = request.nextUrl.searchParams;
    const status = (searchParams.get("status") ?? "all").trim();
    const search = (searchParams.get("search") ?? "").trim().slice(0, 80) || undefined;
    const limitParam = Number(searchParams.get("limit") ?? "100");
    const limit = Number.isFinite(limitParam) ? limitParam : 100;

    const requests = await listAdminServiceRequests({ status, search, limit });
    return jsonOk({ serviceRequests: requests, total: requests.length });
  } catch (error) {
    return errorResponse(error);
  }
}
