import { connection, type NextRequest } from "next/server";
import { createStaffUser, listStaff } from "@/lib/server/accounts";
import { hashPassword, requireApiRole } from "@/lib/server/auth";
import { assertSameOrigin, errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { parseStaffBody } from "@/lib/server/validation";

/**
 * GET /api/admin/staff — admin and staff accounts.
 * Staff may view the directory; only admins may create accounts.
 */
export async function GET() {
  await connection();
  try {
    await requireApiRole(["admin", "staff"]);
    const staff = await listStaff();
    return jsonOk({ staff });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * POST /api/admin/staff — create a staff account. Restricted to admins: the
 * role is fixed to `staff` and can never be chosen by the request body.
 */
export async function POST(request: NextRequest) {
  await connection();
  try {
    assertSameOrigin(request);
    await requireApiRole(["admin"]);
    const input = parseStaffBody(await readJson(request));
    const passwordHash = await hashPassword(input.password);
    const user = await createStaffUser({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passwordHash,
    });
    return jsonOk({ user }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
