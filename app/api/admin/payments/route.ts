import { connection, type NextRequest } from "next/server";
import { listPayments, recordPayment } from "@/lib/server/admin";
import { requireApiRole } from "@/lib/server/auth";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { notifyPaymentRecorded, runInBackground } from "@/lib/server/notifications";
import { parsePaymentBody } from "@/lib/server/validation";

/** GET /api/admin/payments — recent payments recorded by the team. */
export async function GET() {
  await connection();
  try {
    await requireApiRole(["admin", "staff"]);
    const payments = await listPayments(100);
    return jsonOk({ payments });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * POST /api/admin/payments — record a payment against a booking. The amount is
 * checked against the outstanding balance inside a transaction.
 */
export async function POST(request: NextRequest) {
  await connection();
  try {
    assertSameOrigin(request);
    const user = await requireApiRole(["admin", "staff"]);
    const input = parsePaymentBody(await readJson(request));
    const payment = await recordPayment(input, user.id);
    runInBackground(() => notifyPaymentRecorded(payment));
    return jsonOk({ payment }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
