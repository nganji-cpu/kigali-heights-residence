/**
 * Typed, safe errors for the API layer.
 *
 * Anything thrown that is not an ApiError is treated as an unexpected server
 * failure: it is logged on the server and replaced with a generic message so
 * database details and stack traces never reach the browser.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
