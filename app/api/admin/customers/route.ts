import { connection } from "next/server";
import { listCustomers } from "@/lib/server/accounts";
import { requireApiRole } from "@/lib/server/auth";
import { errorResponse, jsonOk } from "@/lib/server/http";

/** GET /api/admin/customers — registered customer accounts with totals. */
export async function GET() {
  await connection();
  try {
    await requireApiRole(["admin", "staff"]);
    const customers = await listCustomers();
    return jsonOk({ customers });
  } catch (error) {
    return errorResponse(error);
  }
}
