import { connection, type NextRequest } from "next/server";
import { requireApiUser } from "@/lib/server/auth";
import { listDraftsForUser, saveDraft } from "@/lib/server/drafts";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { parseDraftBody } from "@/lib/server/validation";

/** GET /api/drafts — every unfinished reservation owned by the signed-in user. */
export async function GET() {
  await connection();
  try {
    const user = await requireApiUser();
    const drafts = await listDraftsForUser(user.id);
    return jsonOk({ drafts });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * POST /api/drafts — create or update the signed-in user's draft. Drafts never
 * reserve an apartment and never block availability.
 */
export async function POST(request: NextRequest) {
  await connection();
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const input = parseDraftBody(await readJson(request));
    const draft = await saveDraft(user.id, input);
    return jsonOk({ draft }, input.id === null ? 201 : 200);
  } catch (error) {
    return errorResponse(error);
  }
}
