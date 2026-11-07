import { connection, type NextRequest } from "next/server";
import { findUserForLogin } from "@/lib/server/accounts";
import { logAdminActivity } from "@/lib/server/admin";
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

const DUMMY_PASSWORD_HASH =
  "$2b$12$FS0HsmECmiA3p8cMaPCODusAYIpkyv0aovluuamsfWvlu/JRH5mW.";

/**
 * POST /api/admin/auth/login
 *
 * Dedicated administrator and staff login endpoint.
 * Enforces rate limiting, bcrypt verification, role verification (admin/staff only),
 * active status, and audit logging.
 */
export async function POST(request: NextRequest) {
  await connection();
  try {
    assertSameOrigin(request);
    const input = parseLoginBody(await readJson(request));
    const clientIp = getClientIp(request);
    const ipHash = hashIp(clientIp);

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
        "This account is not active. Please contact system management.",
      );
    }

    if (account.user.role !== "admin" && account.user.role !== "staff") {
      await recordLoginAttempt(input.email, ipHash, false);
      throw new ApiError(
        403,
        "PORTAL_ACCESS_DENIED",
        "This portal is reserved for residence administrators and staff.",
      );
    }

    await recordLoginAttempt(input.email, ipHash, true);
    await startSession(account.user.id);

    await logAdminActivity({
      userId: account.user.id,
      action: "auth.login",
      entityType: "user",
      entityId: String(account.user.id),
      details: { role: account.user.role },
      ipAddress: clientIp,
    });

    return jsonOk({ user: account.user });
  } catch (error) {
    return errorResponse(error);
  }
}
