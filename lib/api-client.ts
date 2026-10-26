import type { ApiErrorBody } from "@/types";

export type JsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; fields?: Record<string, string> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!isRecord(value) || !isRecord(value.error)) return false;
  return (
    typeof value.error.message === "string" && typeof value.error.code === "string"
  );
}

/**
 * Small JSON POST helper for the client forms.
 *
 * It never throws for an expected HTTP error: callers get a discriminated
 * result they can render. Network failures are handled separately so a guest
 * sees a useful message instead of an unhandled rejection.
 */
export async function postJson<T>(
  url: string,
  body: unknown,
): Promise<JsonResult<T>> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      message: "We could not reach the server. Please check your connection and try again.",
    };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (isApiErrorBody(payload)) {
      return {
        ok: false,
        message: payload.error.message,
        ...(payload.error.fields ? { fields: payload.error.fields } : {}),
      };
    }

    return {
      ok: false,
      message: "The request could not be completed. Please try again.",
    };
  }

  return { ok: true, data: payload as T };
}
