import { connection } from "next/server";
import { errorResponse, jsonOk } from "@/lib/server/http";
import { getRoomMeta } from "@/lib/server/repository";

/**
 * GET /api/rooms/meta
 * Returns the available categories, amenity names and per-level room counts.
 */
export async function GET() {
  await connection();
  try {
    const meta = await getRoomMeta();
    return jsonOk(meta);
  } catch (error) {
    return errorResponse(error);
  }
}
