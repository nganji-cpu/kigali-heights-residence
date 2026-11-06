import { connection, type NextRequest } from "next/server";
import { listAdminClients } from "@/lib/server/admin";
import { requireApiRole } from "@/lib/server/auth";
import { errorResponse, jsonOk } from "@/lib/server/http";

/** GET /api/admin/clients — aggregated client directory across user accounts & bookings. */
export async function GET(request: NextRequest) {
  await connection();
  try {
    await requireApiRole(["admin", "staff"]);
    const searchParams = request.nextUrl.searchParams;
    const search = (searchParams.get("search") ?? "").trim().slice(0, 80) || undefined;

    const clients = await listAdminClients(search);
    return jsonOk({ clients, total: clients.length });
  } catch (error) {
    return errorResponse(error);
  }
}
