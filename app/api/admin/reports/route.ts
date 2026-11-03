import { connection } from "next/server";
import { getReportSummary } from "@/lib/server/admin";
import { requireApiRole } from "@/lib/server/auth";
import { errorResponse, jsonOk } from "@/lib/server/http";

/** GET /api/admin/reports — reservation, revenue and room performance data. */
export async function GET() {
  await connection();
  try {
    await requireApiRole(["admin", "staff"]);
    const report = await getReportSummary();
    return jsonOk({ report });
  } catch (error) {
    return errorResponse(error);
  }
}
