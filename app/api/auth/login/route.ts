import { connection, type NextRequest } from "next/server";
import { findUserForLogin } from "@/lib/server/accounts";
import {
  checkLoginRateLimit,
  getClientIp,
  hashIp,
  recordLoginAttempt,
  startSession,
  verifyPassword,
} from "@/lib/server/auth";
import { ApiError } from "@/lib/server/errors";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { parseLoginBody } from "@/lib/server/validation";

/** A real bcrypt hash used to equalise timing when the email does not exist. */
const DUMMY_PASSWORD_HASH =
  "$2b$12$FS0HsmECmiA3p8cMaPCODusAYIpkyv0aovluuamsfWvlu/JRH5mW.";

/**
 * POST /api/auth/login
 *
 * Database-backed rate limiting runs before the password check. Failures are
 * recorded per email and per hashed IP; a successful sign-in clears them.
 */
export async function POST(request: NextRequest) {
  await connection();
  try {
    assertSameOrigin(request);
    const input = parseLoginBody(await readJson(request));
    const ipHash = hashIp(getClientIp(request));

    const limit = await checkLoginRateLimit(input.email, ipHash);
    if (limit.limited) {
      throw new ApiError(
        429,
        "RATE_LIMITED",
        "Too many sign-in attempts. Please wait a few minutes before trying again.",
      );
    }

    const account = await findUserForLogin(input.email);
    const passwordMatches = await verifyPassword(
      input.password,
      account?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!account || !passwordMatches) {
      await recordLoginAttempt(input.email, ipHash, false);
      throw new ApiError(401, "INVALID_CREDENTIALS", "That email and password do not match.");
    }

    if (account.user.status !== "active") {
      await recordLoginAttempt(input.email, ipHash, false);
      throw new ApiError(
        403,
        "ACCOUNT_INACTIVE",
        "This account is not active. Please contact the residence team.",
      );
    }

    await recordLoginAttempt(input.email, ipHash, true);
    await startSession(account.user.id);
    return jsonOk({ user: account.user });
  } catch (error) {
    return errorResponse(error);
  }
}
