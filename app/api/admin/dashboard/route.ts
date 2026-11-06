import { connection } from "next/server";
import {
  getAdminStats,
  getAdminUpcomingArrivals,
  getAdminUpcomingDepartures,
  listAdminActivity,
  listAdminContactMessages,
  listAdminReservations,
  listAdminServiceRequests,
} from "@/lib/server/admin";
import { requireApiRole } from "@/lib/server/auth";
import { errorResponse, jsonOk } from "@/lib/server/http";

/** GET /api/admin/dashboard — aggregated real operational data for the admin dashboard. */
export async function GET() {
  await connection();
  try {
    await requireApiRole(["admin", "staff"]);

    const [
      stats,
      recentReservations,
      upcomingArrivals,
      upcomingDepartures,
      recentMessages,
      recentServiceRequests,
      recentActivity,
    ] = await Promise.all([
      getAdminStats(),
      listAdminReservations({ limit: 5 }),
      getAdminUpcomingArrivals(5),
      getAdminUpcomingDepartures(5),
      listAdminContactMessages({ limit: 5 }),
      listAdminServiceRequests({ limit: 5 }),
      listAdminActivity(8),
    ]);

    return jsonOk({
      stats,
      recentReservations,
      upcomingArrivals,
      upcomingDepartures,
      recentMessages,
      recentServiceRequests,
      recentActivity,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
