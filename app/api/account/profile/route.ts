import { connection, type NextRequest } from "next/server";
import { updateUserProfile } from "@/lib/server/accounts";
import { requireApiUser } from "@/lib/server/auth";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { parseProfileBody } from "@/lib/server/validation";

/** PATCH /api/account/profile — update the signed-in user's own details. */
export async function PATCH(request: NextRequest) {
  await connection();
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const input = parseProfileBody(await readJson(request));
    const updated = await updateUserProfile(user.id, input);
    return jsonOk({ user: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
