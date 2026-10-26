"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { PriceSummary } from "@/components/ui/price-summary";
import { buildPriceBreakdown, calculateNights, MAX_GUESTS, validateStay } from "@/lib/booking";
import { useToday } from "@/lib/client-store";
import { addDaysISO, cn, formatUSD } from "@/lib/utils";
import type { Room } from "@/types";

interface RoomReserveCardProps {
  room: Room;
  className?: string;
}

/**
 * Sticky reservation panel for an apartment page. Dates update a live price
 * estimate before the guest moves to the booking flow.
 */
export function RoomReserveCard({ room, className }: RoomReserveCardProps) {
  const router = useRouter();
  const today = useToday();
  const minDate = today ?? "";
  const suggestedCheckIn = today ? addDaysISO(today, 14) : "";
  const suggestedCheckOut = today ? addDaysISO(today, 17) : "";

  // `null` means "untouched", so the suggested dates can appear once the
  // browser clock is available without hydrating stale markup.
  const [checkInInput, setCheckInInput] = useState<string | null>(null);
  const [checkOutInput, setCheckOutInput] = useState<string | null>(null);
  const [guests, setGuests] = useState(Math.min(2, room.capacity));

  const checkIn = checkInInput ?? suggestedCheckIn;
  const checkOut = checkOutInput ?? suggestedCheckOut;

  const nights = calculateNights(checkIn, checkOut);

  const errors = useMemo(
    () => validateStay({ checkIn, checkOut, guests, room, today }),
    [checkIn, checkOut, guests, room, today],
  );

  const breakdown = useMemo(
    () => buildPriceBreakdown({ room, nights, guests, services: [] }),
    [room, nights, guests],
  );

  // The server render has no clock, so the suggested dates are only available
  // after hydration. Do not flash a validation error before that happens.
  const ready = today !== null;
  const blocked = !ready || Boolean(errors.checkIn || errors.checkOut || errors.guests);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blocked) return;

    const params = new URLSearchParams({
      room: room.slug,
      checkIn,
      checkOut,
      guests: String(guests),
    });
    router.push(`/book?${params.toString()}`);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-2 border-y border-stone/80 py-5">
        <p className="flex items-baseline gap-2">
          <span className="font-display text-4xl leading-none">{formatUSD(room.pricePerNight)}</span>
          <span className="text-[0.72rem] text-charcoal/70">per night</span>
        </p>
        <p className="text-[0.78rem] text-charcoal/70">Illustrative rate, in USD.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 border border-stone/80 bg-white p-6"
        aria-label={`Reserve ${room.name}`}
      >
        <h2 className="font-display text-2xl">Check dates</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="room-check-in"
              className="text-[0.68rem] font-medium text-charcoal/65"
            >
              Arrival
            </label>
            <Input
              id="room-check-in"
              type="date"
              value={checkIn}
              min={minDate}
              onChange={(event) => setCheckInInput(event.target.value)}
              invalid={Boolean(errors.checkIn)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="room-check-out"
              className="text-[0.68rem] font-medium text-charcoal/65"
            >
              Departure
            </label>
            <Input
              id="room-check-out"
              type="date"
              value={checkOut}
              min={checkIn || minDate}
              onChange={(event) => setCheckOutInput(event.target.value)}
              invalid={Boolean(errors.checkOut)}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="room-guests" className="text-[0.68rem] font-medium text-charcoal/65">
            Guests
          </label>
          <Select
            id="room-guests"
            value={guests}
            invalid={Boolean(errors.guests)}
            onChange={(event) => setGuests(Number(event.target.value))}
          >
            {Array.from({ length: Math.min(MAX_GUESTS, room.capacity) }, (_, index) => index + 1).map(
              (count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? "guest" : "guests"} · sleeps up to {room.capacity}
                </option>
              ),
            )}
          </Select>
        </div>

        {ready && (errors.checkIn || errors.checkOut || errors.guests) ? (
          <p role="alert" className="text-[0.8rem] text-red-700">
            {errors.checkIn ?? errors.checkOut ?? errors.guests}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={blocked}>
          Continue to reserve
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>

        <p className="text-[0.74rem] leading-relaxed text-charcoal/70">
          You will review the dates, services and total before confirming. No payment is taken.
        </p>
      </form>

      <PriceSummary
        breakdown={breakdown}
        title="Stay estimate"
        footer="No payment is taken. You will review the full total before confirming."
      />
    </div>
  );
}
