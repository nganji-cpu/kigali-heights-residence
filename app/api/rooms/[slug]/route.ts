import { connection, type NextRequest } from "next/server";
import { ApiError } from "@/lib/server/errors";
import { errorResponse, jsonOk } from "@/lib/server/http";
import { getRelatedRooms, getRoomBySlug } from "@/lib/server/repository";

/** GET /api/rooms/[slug] — full room detail plus related apartments. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  await connection();
  try {
    const { slug } = await params;
    const room = await getRoomBySlug(slug);

    if (!room) {
      throw new ApiError(404, "ROOM_NOT_FOUND", "That apartment does not exist.");
    }

    const related = await getRelatedRooms(slug, 3);
    return jsonOk({ room, related });
  } catch (error) {
    return errorResponse(error);
  }
}
