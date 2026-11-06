import { connection, type NextRequest } from "next/server";
import { findUserByEmail } from "@/lib/server/accounts";
import { getClientIp, hashIp } from "@/lib/server/auth";
import { isEmailConfigured } from "@/lib/server/email";
import { ApiError } from "@/lib/server/errors";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { notifyPasswordReset } from "@/lib/server/notifications";
import { requestPasswordReset } from "@/lib/server/password-reset";
import { parseForgotPasswordBody } from "@/lib/server/validation";
import type { UserRole } from "@/types";

const GENERIC_MESSAGE =
  "If an account exists for that email address, a password reset link has been sent.";

/**
 * POST /api/auth/forgot-password
 *
 * The response is deliberately generic: it does not reveal whether the address
 * belongs to an account, whether the account is active, or whether the supplied
 * email is for the customer or operations portal. Requests are rate-limited per
 * email address and per hashed IP, including for unknown addresses.
 */
export async function POST(request: NextRequest) {
  await connection();
  try {
    assertSameOrigin(request);
    const input = parseForgotPasswordBody(await readJson(request));
    const ipHash = hashIp(getClientIp(request));
    const allowedRoles: UserRole[] =
      input.portal === "admin" ? ["admin", "staff"] : ["customer"];

    const result = await requestPasswordReset(input.email, ipHash, allowedRoles);

    if (result.limited) {
      throw new ApiError(
        429,
        "RESET_RATE_LIMITED",
        "Too many reset requests. Please wait a few minutes before trying again.",
      );
    }

    // Only an active account in the requested portal receives a token. The
    // response below is identical either way so addresses cannot be enumerated.
    if (result.token) {
      const user = await findUserByEmail(input.email);
      if (user) {
        await notifyPasswordReset({
          user,
          token: result.token,
          portal: input.portal,
          expiresInMinutes: result.expiresInMinutes,
        });
      }
    }

    return jsonOk({
      ok: true,
      message: GENERIC_MESSAGE,
      emailConfigured: isEmailConfigured(),
      expiresInMinutes: result.expiresInMinutes,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
