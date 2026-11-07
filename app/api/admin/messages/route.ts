import { connection, type NextRequest } from "next/server";
import { listAdminContactMessages } from "@/lib/server/admin";
import { requireApiRole } from "@/lib/server/auth";
import { errorResponse, jsonOk } from "@/lib/server/http";

/** GET /api/admin/messages — contact inbox with subject, status and text search filtering. */
export async function GET(request: NextRequest) {
  await connection();
  try {
    await requireApiRole(["admin", "staff"]);
    const searchParams = request.nextUrl.searchParams;
    const status = (searchParams.get("status") ?? "all").trim();
    const subject = (searchParams.get("subject") ?? "all").trim();
    const search = (searchParams.get("search") ?? "").trim().slice(0, 80) || undefined;
    const limitParam = Number(searchParams.get("limit") ?? "100");
    const limit = Number.isFinite(limitParam) ? limitParam : 100;

    const messages = await listAdminContactMessages({ status, subject, search, limit });
    return jsonOk({ messages, total: messages.length });
  } catch (error) {
    return errorResponse(error);
  }
}
