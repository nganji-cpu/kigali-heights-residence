import { connection, type NextRequest } from "next/server";
import { endSession } from "@/lib/server/auth";
import { assertSameOrigin, errorResponse, jsonOk } from "@/lib/server/http";

/** POST /api/auth/logout — deletes the session row and clears the cookie. */
export async function POST(request: NextRequest) {
  await connection();
  try {
    assertSameOrigin(request);
    await endSession();
    return jsonOk({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
