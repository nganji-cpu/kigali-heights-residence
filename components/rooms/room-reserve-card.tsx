"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, User } from "lucide-react";
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
 * Sticky reservation panel for an apartment page. Dates update a live,
 * illustrative price estimate before the guest moves to the booking flow.
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

  const blocked = Boolean(errors.checkIn || errors.checkOut || errors.guests);

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
      <div className="flex flex-col gap-1.5 border border-stone/80 bg-white p-6">
        <p className="flex items-baseline gap-2">
          <span className="font-display text-4xl leading-none">{formatUSD(room.pricePerNight)}</span>
          <span className="text-[0.72rem] uppercase tracking-[0.16em] text-charcoal/50">
            per night · sample
          </span>
        </p>
        <p className="text-[0.8rem] text-charcoal/55">
          Illustrative rate for the concept prototype not a real tariff.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 border border-stone/80 bg-white p-6"
        aria-label={`Reserve ${room.name}`}
      >
        <h2 className="font-display text-2xl">Check this apartment</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="room-check-in"
              className="flex items-center gap-2 text-[0.66rem] font-medium uppercase tracking-[0.18em] text-charcoal/65"
            >
              <CalendarDays aria-hidden="true" className="size-3.5 text-bronze" />
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
              className="flex items-center gap-2 text-[0.66rem] font-medium uppercase tracking-[0.18em] text-charcoal/65"
            >
              <CalendarDays aria-hidden="true" className="size-3.5 text-bronze" />
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
          <label
            htmlFor="room-guests"
            className="flex items-center gap-2 text-[0.66rem] font-medium uppercase tracking-[0.18em] text-charcoal/65"
          >
            <User aria-hidden="true" className="size-3.5 text-bronze" />
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

        {errors.checkIn || errors.checkOut || errors.guests ? (
          <p role="alert" className="text-[0.8rem] text-red-700">
            {errors.checkIn ?? errors.checkOut ?? errors.guests}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={blocked}>
          Reserve this apartment
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>

        <p className="text-[0.74rem] leading-relaxed text-charcoal/50">
          Continues to the reservation flow, where you can add services and review an estimate
          before a demo confirmation.
        </p>
      </form>

      <PriceSummary
        breakdown={breakdown}
        title="Stay estimate"
        footer="Demonstration calculation only. No payment is taken and no reservation is created."
      />
    </div>
  );
}
