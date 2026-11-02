import { NextResponse } from "next/server";
import type { ApiErrorBody } from "@/types";
import { ApiError } from "./errors";

/**
 * Converts any thrown value into a safe JSON response.
 *
 * Known ApiErrors keep their status/message/field errors. Anything else is
 * logged on the server and replaced with a generic 500 so SQL text, table
 * names, stack traces and credentials never reach the browser.
 */
export function errorResponse(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          ...(error.fields ? { fields: error.fields } : {}),
        },
      },
      { status: error.status },
    );
  }

  console.error("Unexpected API error:", error);

  return NextResponse.json(
    {
      error: {
        message: "Something went wrong on the server. Please try again.",
        code: "INTERNAL_ERROR",
      },
    },
    { status: 500 },
  );
}

/** Parses a JSON request body, returning a 400 ApiError for malformed JSON. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}

/**
 * Rejects state-changing requests whose Origin does not match this deployment.
 *
 * Browsers always send Origin on cross-site form/fetch requests, so this blocks
 * CSRF while still allowing same-origin fetch calls and command-line clients
 * that omit the header. Authentication is always checked separately.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new ApiError(403, "INVALID_ORIGIN", "That request origin is not allowed.");
  }

  const requestHost = request.headers.get("host") ?? new URL(request.url).host;
  const configured = process.env.NEXT_PUBLIC_SITE_URL
    ? safeHost(process.env.NEXT_PUBLIC_SITE_URL)
    : null;

  if (originHost !== requestHost && originHost !== configured) {
    throw new ApiError(403, "INVALID_ORIGIN", "That request origin is not allowed.");
  }
}

function safeHost(value: string): string | null {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

export function jsonOk<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
