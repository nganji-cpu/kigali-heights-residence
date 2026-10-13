"use client";

import { useSyncExternalStore } from "react";
import { bookingDraftStore, selectedServicesStore } from "@/lib/booking";
import { todayISO } from "@/lib/utils";
import type { BookingSelection } from "@/types";

/**
 * Client-only stores.
 *
 * Next.js prerenders Client Components, so reading `new Date()` or
 * `localStorage` during render raises an unstable-value error, and hydrating
 * the value back from a `useEffect` triggers cascading renders. Reading through
 * `useSyncExternalStore` avoids both: the server render uses a stable fallback
 * snapshot and the browser value is swapped in after hydration.
 */

const subscribeToNothing = () => () => {};

function getTodaySnapshot(): string {
  return todayISO();
}

function getTodayServerSnapshot(): string | null {
  return null;
}

/** Today's date as "YYYY-MM-DD" once running in the browser, else `null`. */
export function useToday(): string | null {
  return useSyncExternalStore(subscribeToNothing, getTodaySnapshot, getTodayServerSnapshot);
}

/** Guest services saved from the services page, shared across the session. */
export function useSelectedServices(): string[] {
  return useSyncExternalStore(
    selectedServicesStore.subscribe,
    selectedServicesStore.getSnapshot,
    selectedServicesStore.getServerSnapshot,
  );
}

/** The in-progress reservation draft persisted to this browser. */
export function useBookingDraft(): Partial<BookingSelection> {
  return useSyncExternalStore(
    bookingDraftStore.subscribe,
    bookingDraftStore.getSnapshot,
    bookingDraftStore.getServerSnapshot,
  );
}
