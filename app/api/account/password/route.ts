import { connection, type NextRequest } from "next/server";
import {
  deleteUserSessions,
  findUserForLogin,
  updateUserPasswordHash,
} from "@/lib/server/accounts";
import { getSessionContext, hashPassword, verifyPassword } from "@/lib/server/auth";
import { ApiError } from "@/lib/server/errors";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { parsePasswordChangeBody } from "@/lib/server/validation";

/**
 * POST /api/account/password
 *
 * Verifies the current password, stores a new bcrypt hash and signs out every
 * other session so a stolen cookie cannot outlive a password change.
 */
export async function POST(request: NextRequest) {
  await connection();
  try {
    assertSameOrigin(request);
    const context = await getSessionContext();
    if (!context) {
      throw new ApiError(401, "AUTH_REQUIRED", "Please sign in to continue.");
    }

    const input = parsePasswordChangeBody(await readJson(request));
    const account = await findUserForLogin(context.user.email);
    if (!account) {
      throw new ApiError(401, "AUTH_REQUIRED", "Please sign in to continue.");
    }

    const valid = await verifyPassword(input.currentPassword, account.passwordHash);
    if (!valid) {
      throw new ApiError(422, "INVALID_PASSWORD", "Your current password is not correct.", {
        currentPassword: "Your current password is not correct.",
      });
    }

    const passwordHash = await hashPassword(input.newPassword);
    await updateUserPasswordHash(context.user.id, passwordHash);
    await deleteUserSessions(context.user.id, context.tokenHash);

    return jsonOk({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
