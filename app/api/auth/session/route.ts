import { connection } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { errorResponse, jsonOk } from "@/lib/server/http";

/** GET /api/auth/session — the signed-in user, or `{ user: null }`. */
export async function GET() {
  await connection();
  try {
    const user = await getSessionUser();
    return jsonOk({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
