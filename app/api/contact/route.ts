import type { NextRequest } from "next/server";
import { errorResponse, jsonOk, readJson } from "@/lib/server/http";
import { createContactMessage } from "@/lib/server/repository";
import { parseContactBody } from "@/lib/server/validation";

/**
 * POST /api/contact
 * Body: { name, email, subject, message }
 *
 * Persists a contact message. This is a design concept, so no live inbox or
 * reply workflow is attached to the record.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request);
    const input = parseContactBody(body);
    const message = await createContactMessage(input);
    return jsonOk({ message }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
