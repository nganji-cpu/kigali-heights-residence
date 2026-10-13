"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { MAX_GUESTS } from "@/lib/booking";
import { useToday } from "@/lib/client-store";
import { addDaysISO, cn, todayISO } from "@/lib/utils";

interface BookingSearchPanelProps {
  className?: string;
  /** "hero" sits over a dark image, "inline" sits on a light section. */
  variant?: "hero" | "inline";
}

/**
 * Date + guest search panel. Pushes a validated selection to /book through
 * URL query parameters so nothing is lost between pages.
 */
export function BookingSearchPanel({ className, variant = "inline" }: BookingSearchPanelProps) {
  const router = useRouter();
  const today = useToday();
  const minDate = today ?? "";
  const suggestedCheckIn = today ? addDaysISO(today, 14) : "";
  const suggestedCheckOut = today ? addDaysISO(today, 17) : "";

  // `null` means "untouched", so the suggested dates can appear once the
  // browser clock is available without hydrating stale markup.
  const [checkInInput, setCheckInInput] = useState<string | null>(null);
  const [checkOutInput, setCheckOutInput] = useState<string | null>(null);
  const [guests, setGuests] = useState(2);
  const [error, setError] = useState<string | null>(null);

  const checkIn = checkInInput ?? suggestedCheckIn;
  const checkOut = checkOutInput ?? suggestedCheckOut;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const boundary = today ?? todayISO();
    if (!checkIn || !checkOut) {
      setError("Please choose both an arrival and a departure date.");
      return;
    }
    if (checkIn < boundary) {
      setError("Arrival cannot be earlier than today.");
      return;
    }
    if (checkOut <= checkIn) {
      setError("Departure must be at least one night after arrival.");
      return;
    }

    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
    });
    router.push(`/book?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "border border-stone/80 bg-ivory/97 p-5 shadow-[var(--shadow-lift)] backdrop-blur-sm sm:p-6",
        variant === "hero" && "border-ivory/60",
        className,
      )}
      aria-label="Check availability"
    >
      <div className="flex items-center justify-between gap-4 pb-4">
        <h2 className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-charcoal/70">
          Plan your stay
        </h2>
        <span className="text-[0.7rem] uppercase tracking-[0.16em] text-charcoal/45">
          Sample availability
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr_auto] lg:items-end">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="search-check-in"
            className="flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-charcoal/65"
          >
            <CalendarDays aria-hidden="true" className="size-3.5 text-bronze" />
            Check-in
          </label>
          <Input
            id="search-check-in"
            type="date"
            value={checkIn}
            min={minDate}
            onChange={(event) => setCheckInInput(event.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="search-check-out"
            className="flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-charcoal/65"
          >
            <CalendarDays aria-hidden="true" className="size-3.5 text-bronze" />
            Check-out
          </label>
          <Input
            id="search-check-out"
            type="date"
            value={checkOut}
            min={checkIn || minDate}
            onChange={(event) => setCheckOutInput(event.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="search-guests"
            className="flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-charcoal/65"
          >
            <User aria-hidden="true" className="size-3.5 text-bronze" />
            Guests
          </label>
          <Select
            id="search-guests"
            value={guests}
            onChange={(event) => setGuests(Number(event.target.value))}
          >
            {Array.from({ length: MAX_GUESTS }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "guest" : "guests"}
              </option>
            ))}
          </Select>
        </div>

        <Button type="submit" size="lg" className="w-full lg:w-auto">
          <Search aria-hidden="true" className="size-4" />
          Search
        </Button>
      </div>

      {error ? (
        <p role="alert" className="pt-3 text-[0.82rem] text-red-700">
          {error}
        </p>
      ) : (
        <p className="pt-3 text-[0.75rem] text-charcoal/45">
          Illustrative availability this prototype does not check real calendars.
        </p>
      )}
    </form>
  );
}
