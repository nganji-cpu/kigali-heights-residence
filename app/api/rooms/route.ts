import { connection, type NextRequest } from "next/server";
import { isRoomCategory } from "@/data/rooms";
import { ApiError } from "@/lib/server/errors";
import { errorResponse, jsonOk } from "@/lib/server/http";
import { listRooms, type ListRoomsOptions } from "@/lib/server/repository";

/**
 * GET /api/rooms?category=deluxe&level=3&guests=2
 * Returns rooms from the database. All filters are optional.
 */
export async function GET(request: NextRequest) {
  await connection();
  try {
    const searchParams = request.nextUrl.searchParams;
    const options: ListRoomsOptions = {};

    const category = searchParams.get("category");
    if (category) {
      if (!isRoomCategory(category)) {
        throw new ApiError(400, "INVALID_CATEGORY", "Unknown apartment category.");
      }
      options.category = category;
    }

    const levelParam = searchParams.get("level");
    if (levelParam) {
      const level = Number(levelParam);
      if (!Number.isInteger(level) || level < 2 || level > 5) {
        throw new ApiError(400, "INVALID_LEVEL", "Level must be an integer from 2 to 5.");
      }
      options.level = level;
    }

    const guestsParam = searchParams.get("guests");
    if (guestsParam) {
      const guests = Number(guestsParam);
      if (!Number.isInteger(guests) || guests < 1 || guests > 6) {
        throw new ApiError(400, "INVALID_GUESTS", "Guests must be an integer from 1 to 6.");
      }
      options.guests = guests;
    }

    const featured = searchParams.get("featured");
    if (featured === "true") options.featuredOnly = true;

    const rooms = await listRooms(options);
    return jsonOk({ rooms, total: rooms.length });
  } catch (error) {
    return errorResponse(error);
  }
}
