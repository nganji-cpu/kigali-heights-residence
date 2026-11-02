import { connection, type NextRequest } from "next/server";
import { requireApiUser } from "@/lib/server/auth";
import { discardDraft, resumeDraft } from "@/lib/server/drafts";
import { assertSameOrigin, errorResponse, jsonOk } from "@/lib/server/http";
import { parseIdParam } from "@/lib/server/validation";

/**
 * GET /api/drafts/[id]
 *
 * Reloads a draft and re-checks it against current dates, availability,
 * capacity, prices and services. Every difference is returned as a warning so
 * the customer can read what changed before continuing.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const result = await resumeDraft(user.id, parseIdParam(id));
    return jsonOk(result);
  } catch (error) {
    return errorResponse(error);
  }
}

/** DELETE /api/drafts/[id] — discard one of the signed-in user's drafts. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const { id } = await params;
    await discardDraft(user.id, parseIdParam(id));
    return jsonOk({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
