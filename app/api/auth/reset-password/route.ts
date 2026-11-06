import { after, connection, type NextRequest } from "next/server";
import { findUserById } from "@/lib/server/accounts";
import { hashPassword } from "@/lib/server/auth";
import { ApiError } from "@/lib/server/errors";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { notifyPasswordChanged } from "@/lib/server/notifications";
import { consumePasswordResetToken } from "@/lib/server/password-reset";
import { parseResetPasswordBody } from "@/lib/server/validation";

/**
 * POST /api/auth/reset-password
 *
 * Consumes a single-use token, replaces the bcrypt hash, and deletes every
 * existing session for the account. Replaying the same link fails because the
 * token row is marked used inside the same transaction.
 */
export async function POST(request: NextRequest) {
  await connection();
  try {
    assertSameOrigin(request);
    const input = parseResetPasswordBody(await readJson(request));
    const passwordHash = await hashPassword(input.password);
    const userId = await consumePasswordResetToken(input.token, passwordHash);
    const user = await findUserById(userId);

    if (!user) {
      throw new ApiError(
        400,
        "INVALID_RESET_TOKEN",
        "That password reset link is invalid or has expired. Please request a new one.",
      );
    }

    after(async () => {
      await notifyPasswordChanged({
        user,
        portal: user.role === "admin" || user.role === "staff" ? "admin" : "customer",
      });
    });

    return jsonOk({
      ok: true,
      message: "Your password has been changed. Sign in with your new password.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
