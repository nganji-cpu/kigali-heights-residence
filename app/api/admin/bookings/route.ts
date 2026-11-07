import { connection, type NextRequest } from "next/server";
import { listAdminReservations } from "@/lib/server/admin";
import { requireApiRole } from "@/lib/server/auth";
import { errorResponse, jsonOk } from "@/lib/server/http";
import { RESERVATION_STATUSES, type AdminReservationStatus } from "@/lib/server/validation";
import type { BookingStatus } from "@/types";

/** GET /api/admin/bookings — filtered reservations for admin and staff. */
export async function GET(request: NextRequest) {
  await connection();
  try {
    await requireApiRole(["admin", "staff"]);
    const searchParams = request.nextUrl.searchParams;
    const rawStatus = searchParams.get("status") ?? "all";
    const status =
      rawStatus === "all" || RESERVATION_STATUSES.includes(rawStatus as AdminReservationStatus)
        ? (rawStatus as BookingStatus | "all")
        : "all";
    const roomSlug = (searchParams.get("roomSlug") ?? "").trim() || undefined;
    const search = (searchParams.get("search") ?? "").trim().slice(0, 80) || undefined;
    const limitParam = Number(searchParams.get("limit") ?? "100");
    const limit = Number.isFinite(limitParam) ? limitParam : 100;

    const reservations = await listAdminReservations({ status, roomSlug, search, limit });
    return jsonOk({ reservations, total: reservations.length });
  } catch (error) {
    return errorResponse(error);
  }
}
