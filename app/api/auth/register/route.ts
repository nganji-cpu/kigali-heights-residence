import { connection, type NextRequest } from "next/server";
import { createUser, findUserByEmail } from "@/lib/server/accounts";
import { hashPassword, startSession } from "@/lib/server/auth";
import { ApiError } from "@/lib/server/errors";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { notifyAdminNewCustomer, notifyWelcome, runInBackground } from "@/lib/server/notifications";
import { parseRegisterBody } from "@/lib/server/validation";

/**
 * POST /api/auth/register
 *
 * Creates a customer account only. The role is never read from the request, so
 * a visitor cannot register as staff or admin. The new account is signed in
 * immediately with a database-backed session.
 */
export async function POST(request: NextRequest) {
  await connection();
  try {
    assertSameOrigin(request);
    const input = parseRegisterBody(await readJson(request));

    const existing = await findUserByEmail(input.email);
    if (existing) {
      throw new ApiError(
        409,
        "EMAIL_TAKEN",
        "An account with that email already exists.",
        { email: "An account with that email already exists." },
      );
    }

    const passwordHash = await hashPassword(input.password);
    const user = await createUser({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: "customer",
    });

    await startSession(user.id);
    runInBackground(() => Promise.all([notifyWelcome(user), notifyAdminNewCustomer(user)]));
    return jsonOk({ user }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
