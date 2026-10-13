/**
 * Small, dependency-free helpers shared across the prototype.
 */

/** Joins conditional class names. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Formats a whole-dollar amount, e.g. 185 -> "$185". */
export function formatUSD(amount: number): string {
  return usdFormatter.format(Math.round(amount));
}

/** Formats a number with thousands separators. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

const longDateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Formats a "YYYY-MM-DD" string for display; returns "—" when empty. */
export function formatDateLong(iso: string): string {
  const date = parseISODate(iso);
  if (!date) return "—";
  return longDateFormatter.format(date);
}

const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

/** Formats a "YYYY-MM-DD" string as "12 Oct". */
export function formatDateShort(iso: string): string {
  const date = parseISODate(iso);
  if (!date) return "—";
  return shortDateFormatter.format(date);
}

/**
 * Parses a "YYYY-MM-DD" value into a local Date at midnight.
 * Returns null for empty or malformed input.
 */
export function parseISODate(value: string): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** Serialises a Date into the "YYYY-MM-DD" format used by date inputs. */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's date as "YYYY-MM-DD" (local). */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Adds `days` to an ISO date string and returns a new ISO date string. */
export function addDaysISO(iso: string, days: number): string {
  const date = parseISODate(iso);
  if (!date) return iso;
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Whole days between two ISO dates (can be negative or zero). */
export function daysBetween(startISO: string, endISO: string): number {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  if (!start || !end) return 0;
  const ms = end.getTime() - start.getTime();
  return Math.round(ms / 86_400_000);
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : plural ?? `${singular}s`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Rough, human-friendly label for a guest count. */
export function guestsLabel(guests: number): string {
  return `${guests} ${pluralize(guests, "guest")}`;
}
