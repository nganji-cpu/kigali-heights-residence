"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CircleCheck,
  Plus,
  User,
  Users,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PriceSummary } from "@/components/ui/price-summary";
import { StatusMessage } from "@/components/ui/status-message";
import { ConceptNotice } from "@/components/layout/concept-notice";
import { categoryLabels, getRoomBySlug, rooms } from "@/data/rooms";
import { getServicesBySlugs, services } from "@/data/services";
import {
  buildPriceBreakdown,
  calculateNights,
  generateReference,
  hasErrors,
  MAX_GUESTS,
  validateGuestDetails,
  validateStay,
  writeBookingDraft,
} from "@/lib/booking";
import { useBookingDraft, useSelectedServices, useToday } from "@/lib/client-store";
import { addDaysISO, cn, formatDateLong, formatUSD, pluralize } from "@/lib/utils";
import type { BookingFormErrors, BookingFormValues } from "@/types";

export interface BookingInitialSelection {
  roomSlug: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
}

interface ConfirmationSummary {
  reference: string;
  guestName: string;
  email: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  serviceNames: string[];
  total: number;
}

const steps = [
  { id: "stay", label: "Your stay", hint: "Dates, guests and apartment" },
  { id: "services", label: "Services", hint: "Optional add-ons" },
  { id: "details", label: "Your details", hint: "Contact information" },
  { id: "review", label: "Review", hint: "Confirm the estimate" },
] as const;

/**
 * Multi-step reservation flow.
 *
 * Steps validate before advancing, prices recalculate live, and the final step
 * produces a clearly-labelled demonstration reference. No payment details are
 * requested and no reservation is created.
 */
export function BookingForm({ initial }: { initial: BookingInitialSelection }) {
  const { roomSlug: initialRoom, checkIn: initialCheckIn, checkOut: initialCheckOut, guests: initialGuests } =
    initial;

  const today = useToday();
  const draft = useBookingDraft();
  const storedServices = useSelectedServices();

  const [step, setStep] = useState(0);
  // Each field starts as `null` ("untouched"). Its value resolves through the
  // URL selection, then the saved draft, then a default that can only be known
  // in the browser. Nothing is written to state during render or effects.
  const [checkInOverride, setCheckInOverride] = useState<string | null>(null);
  const [checkOutOverride, setCheckOutOverride] = useState<string | null>(null);
  const [guestsOverride, setGuestsOverride] = useState<number | null>(null);
  const [roomOverride, setRoomOverride] = useState<string | null>(null);
  const [servicesOverride, setServicesOverride] = useState<string[] | null>(null);
  const [details, setDetails] = useState<BookingFormValues>({
    fullName: "",
    email: "",
    phone: "",
    requests: "",
  });
  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationSummary | null>(null);

  const defaultCheckIn = initialCheckIn || draft.checkIn || (today ? addDaysISO(today, 14) : "");
  const defaultCheckOut = initialCheckOut || draft.checkOut || (today ? addDaysISO(today, 17) : "");
  const defaultGuests = initialGuests ?? (typeof draft.guests === "number" ? draft.guests : 2);
  const defaultRoom = initialRoom ?? draft.roomSlug ?? null;

  const checkIn = checkInOverride ?? defaultCheckIn;
  const checkOut = checkOutOverride ?? defaultCheckOut;
  const guests = guestsOverride ?? defaultGuests;
  const roomSlug = roomOverride ?? defaultRoom;
  const selectedServices = servicesOverride ?? storedServices;
  const minDate = today ?? "";

  const room = roomSlug ? getRoomBySlug(roomSlug) : undefined;
  const nights = calculateNights(checkIn, checkOut);
  const chosenServices = useMemo(() => getServicesBySlugs(selectedServices), [selectedServices]);
  const breakdown = useMemo(
    () => buildPriceBreakdown({ room, nights, guests, services: chosenServices }),
    [room, nights, guests, chosenServices],
  );

  // Keep a draft so a refresh does not lose the selection.
  useEffect(() => {
    writeBookingDraft({ checkIn, checkOut, guests, roomSlug, services: selectedServices });
  }, [checkIn, checkOut, guests, roomSlug, selectedServices]);

  const stayErrors = useMemo(
    () => validateStay({ checkIn, checkOut, guests, room, today }),
    [checkIn, checkOut, guests, room, today],
  );

  function toggleService(slug: string) {
    setServicesOverride(
      selectedServices.includes(slug)
        ? selectedServices.filter((item) => item !== slug)
        : [...selectedServices, slug],
    );
  }

  function goNext() {
    if (step === 0) {
      if (hasErrors(stayErrors)) {
        setErrors(stayErrors);
        return;
      }
    }
    if (step === 2) {
      const detailErrors = validateGuestDetails(details);
      if (hasErrors(detailErrors)) {
        setErrors(detailErrors);
        return;
      }
    }
    setErrors({});
    setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  function goBack() {
    setErrors({});
    setStep((value) => Math.max(value - 1, 0));
  }

  function handleConfirm() {
    if (!room) {
      setErrors({ roomSlug: "Please choose an apartment before confirming." });
      setStep(0);
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      setConfirmation({
        reference: generateReference(),
        guestName: details.fullName.trim(),
        email: details.email.trim(),
        roomName: room.name,
        checkIn,
        checkOut,
        nights,
        guests,
        serviceNames: chosenServices.map((service) => service.name),
        total: breakdown.total,
      });
      writeBookingDraft({});
      setSubmitting(false);
    }, 650);
  }

  function startOver() {
    setConfirmation(null);
    setStep(0);
    setDetails({ fullName: "", email: "", phone: "", requests: "" });
    setErrors({});
  }

  /* ----------------------------- Confirmation ----------------------------- */
  if (confirmation) {
    return (
      <div className="panel-in flex flex-col gap-8">
        <StatusMessage
          tone="success"
          title="Demonstration reservation recorded"
          className="max-w-3xl"
        >
          This is a simulated confirmation. No booking was created, no apartment was held and no
          payment was taken.
        </StatusMessage>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-6 border border-stone/80 bg-white p-6 sm:p-8">
            <div className="flex flex-col gap-2 border-b border-stone/70 pb-6">
              <span className="eyebrow">Reference</span>
              <p className="font-display text-4xl tracking-[0.04em] text-charcoal">
                {confirmation.reference}
              </p>
              <p className="text-[0.82rem] text-charcoal/55">
                Keep this reference for the demonstration only it is not a real reservation code.
              </p>
            </div>

            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {[
                { label: "Lead guest", value: confirmation.guestName },
                { label: "Email", value: confirmation.email },
                { label: "Apartment", value: confirmation.roomName },
                { label: "Guests", value: `${confirmation.guests} ${pluralize(confirmation.guests, "guest")}` },
                { label: "Arrival", value: formatDateLong(confirmation.checkIn) },
                { label: "Departure", value: formatDateLong(confirmation.checkOut) },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-1.5">
                  <dt className="text-[0.66rem] uppercase tracking-[0.18em] text-charcoal/50">
                    {item.label}
                  </dt>
                  <dd className="text-[0.95rem] text-charcoal">{item.value}</dd>
                </div>
              ))}
            </dl>

            {confirmation.serviceNames.length > 0 ? (
              <div className="flex flex-col gap-3 border-t border-stone/70 pt-6">
                <h3 className="text-[0.66rem] uppercase tracking-[0.18em] text-charcoal/50">
                  Guest services requested
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {confirmation.serviceNames.map((name) => (
                    <li
                      key={name}
                      className="inline-flex items-center gap-1.5 border border-bronze/30 bg-bronze/8 px-3 py-1.5 text-[0.78rem] text-charcoal"
                    >
                      <Check aria-hidden="true" className="size-3 text-bronze" />
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 border-t border-stone/70 pt-6">
              <ButtonLink href="/rooms">Browse more apartments</ButtonLink>
              <Button variant="secondary" onClick={startOver}>
                Start a new search
              </Button>
              <Link
                href="/contact"
                className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-charcoal underline-offset-4 hover:text-bronze hover:underline"
              >
                Contact the concierge
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <PriceSummary
              breakdown={breakdown}
              title="Estimated total"
              footer="Demonstration calculation only. Illustrative sample rates — not a real quote."
            />
            <ConceptNotice tone="light" />
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------- Wizard -------------------------------- */
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
      <div className="flex flex-col gap-8">
        {/* Step indicator */}
        <ol className="grid grid-cols-2 gap-px border border-stone/80 bg-stone/70 sm:grid-cols-4">
          {steps.map((item, index) => {
            const active = index === step;
            const complete = index < step;
            return (
              <li key={item.id} className="bg-white">
                <button
                  type="button"
                  onClick={() => setStep(index)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex w-full flex-col gap-1 p-4 text-left transition-colors duration-300",
                    active ? "bg-canvas" : "hover:bg-canvas/60",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center gap-2 text-[0.62rem] font-medium uppercase tracking-[0.18em]",
                      active ? "text-bronze" : "text-charcoal/45",
                    )}
                  >
                    {complete ? (
                      <CircleCheck aria-hidden="true" className="size-3.5 text-sage" />
                    ) : (
                      <span>{String(index + 1).padStart(2, "0")}</span>
                    )}
                    Step {index + 1}
                  </span>
                  <span
                    className={cn(
                      "font-display text-lg leading-tight",
                      active ? "text-charcoal" : "text-charcoal/70",
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="text-[0.7rem] text-charcoal/45">{item.hint}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Step content */}
        <div className="flex flex-col gap-8 border border-stone/80 bg-white p-6 sm:p-8">
          {step === 0 ? (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-1.5">
                <h2 className="font-display text-3xl">When are you arriving?</h2>
                <p className="text-[0.92rem] text-charcoal/60">
                  Choose your dates and party size, then pick an apartment.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <Field id="book-check-in" label="Arrival" required error={errors.checkIn}>
                  <Input
                    id="book-check-in"
                    type="date"
                    value={checkIn}
                    min={minDate}
                    invalid={Boolean(errors.checkIn)}
                    onChange={(event) => setCheckInOverride(event.target.value)}
                  />
                </Field>
                <Field id="book-check-out" label="Departure" required error={errors.checkOut}>
                  <Input
                    id="book-check-out"
                    type="date"
                    value={checkOut}
                    min={checkIn || minDate}
                    invalid={Boolean(errors.checkOut)}
                    onChange={(event) => setCheckOutOverride(event.target.value)}
                  />
                </Field>
                <Field id="book-guests" label="Guests" hint={`Max ${MAX_GUESTS}`} error={errors.guests}>
                  <Select
                    id="book-guests"
                    value={guests}
                    invalid={Boolean(errors.guests)}
                    onChange={(event) => setGuestsOverride(Number(event.target.value))}
                  >
                    {Array.from({ length: MAX_GUESTS }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>
                        {count} {count === 1 ? "guest" : "guests"}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-charcoal/60">
                    <Users aria-hidden="true" className="size-3.5 text-bronze" />
                    Choose an apartment
                  </h3>
                  {room ? (
                    <span className="text-[0.72rem] text-charcoal/50">
                      Sleeps up to {room.capacity} · {formatUSD(room.pricePerNight)} / night
                    </span>
                  ) : null}
                </div>

                <div
                  role="radiogroup"
                  aria-label="Choose an apartment"
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {rooms.map((option) => {
                    const active = option.slug === roomSlug;
                    const tooSmall = guests > option.capacity;
                    return (
                      <label
                        key={option.id}
                        className={cn(
                          "flex cursor-pointer flex-col gap-1.5 border p-4 transition-colors duration-300",
                          active
                            ? "border-bronze bg-bronze/8"
                            : "border-stone/90 hover:border-charcoal/40",
                        )}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="font-display text-xl leading-tight">{option.name}</span>
                          <input
                            type="radio"
                            name="room"
                            value={option.slug}
                            checked={active}
                            onChange={() => setRoomOverride(option.slug)}
                            className="sr-only"
                          />
                          <span
                            aria-hidden="true"
                            className={cn(
                              "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border",
                              active ? "border-bronze bg-bronze text-white" : "border-charcoal/30",
                            )}
                          >
                            {active ? <Check className="size-3" /> : null}
                          </span>
                        </span>
                        <span className="text-[0.78rem] text-charcoal/55">
                          {categoryLabels[option.category]} · Level {option.floor} · {formatUSD(option.pricePerNight)}/night
                        </span>
                        {tooSmall ? (
                          <span className="text-[0.72rem] text-red-700">
                            Sleeps up to {option.capacity} guests
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
                {errors.roomSlug ? (
                  <p role="alert" className="text-[0.82rem] text-red-700">
                    {errors.roomSlug}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <h2 className="font-display text-3xl">Anything to add?</h2>
                <p className="text-[0.92rem] text-charcoal/60">
                  Optional guest services. Prices are illustrative and scale with your nights and
                  guests in the summary.
                </p>
              </div>

              <ul className="flex flex-col divide-y divide-stone/60 border-y border-stone/60">
                {services.map((service) => {
                  const active = selectedServices.includes(service.slug);
                  return (
                    <li key={service.id}>
                      <label className="flex cursor-pointer items-start justify-between gap-4 py-4">
                        <span className="flex items-start gap-3">
                          <span
                            className={cn(
                              "mt-0.5 flex size-5 shrink-0 items-center justify-center border transition-colors duration-300",
                              active ? "border-bronze bg-bronze text-white" : "border-charcoal/30",
                            )}
                            aria-hidden="true"
                          >
                            {active ? <Check className="size-3" /> : <Plus className="size-3 text-charcoal/40" />}
                          </span>
                          <span className="flex flex-col gap-1">
                            <span className="font-display text-xl leading-tight">{service.name}</span>
                            <span className="text-[0.84rem] leading-relaxed text-charcoal/60">
                              {service.summary}
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-[0.88rem] text-charcoal">
                            from {formatUSD(service.samplePrice)}
                          </span>
                          <span className="block text-[0.68rem] uppercase tracking-[0.14em] text-charcoal/45">
                            {service.priceNote}
                          </span>
                        </span>
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleService(service.slug)}
                          className="sr-only"
                        />
                      </label>
                    </li>
                  );
                })}
              </ul>

              <p className="text-[0.78rem] text-charcoal/50">
                {selectedServices.length > 0
                  ? `${selectedServices.length} ${pluralize(selectedServices.length, "service")} selected.`
                  : "No services selected you can skip this step."}
              </p>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <h2 className="font-display text-3xl">Who is the lead guest?</h2>
                <p className="text-[0.92rem] text-charcoal/60">
                  Used only for the demonstration confirmation nothing is sent anywhere.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="book-name" label="Full name" required error={errors.fullName} className="sm:col-span-2">
                  <Input
                    id="book-name"
                    value={details.fullName}
                    autoComplete="name"
                    invalid={Boolean(errors.fullName)}
                    onChange={(event) => setDetails((value) => ({ ...value, fullName: event.target.value }))}
                  />
                </Field>
                <Field id="book-email" label="Email" required error={errors.email}>
                  <Input
                    id="book-email"
                    type="email"
                    value={details.email}
                    autoComplete="email"
                    invalid={Boolean(errors.email)}
                    onChange={(event) => setDetails((value) => ({ ...value, email: event.target.value }))}
                  />
                </Field>
                <Field id="book-phone" label="Phone" required error={errors.phone}>
                  <Input
                    id="book-phone"
                    type="tel"
                    value={details.phone}
                    autoComplete="tel"
                    invalid={Boolean(errors.phone)}
                    onChange={(event) => setDetails((value) => ({ ...value, phone: event.target.value }))}
                  />
                </Field>
                <Field
                  id="book-requests"
                  label="Requests"
                  hint="Optional"
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="book-requests"
                    value={details.requests}
                    placeholder="Arrival time, dietary notes, transfers, anything else."
                    onChange={(event) => setDetails((value) => ({ ...value, requests: event.target.value }))}
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-1.5">
                <h2 className="font-display text-3xl">Review your stay</h2>
                <p className="text-[0.92rem] text-charcoal/60">
                  Check the details below. Confirming produces a demonstration reference only.
                </p>
              </div>

              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {[
                  { label: "Apartment", value: room ? `${room.name} (Level ${room.floor})` : "Not selected" },
                  { label: "Guests", value: `${guests} ${pluralize(guests, "guest")}` },
                  { label: "Arrival", value: formatDateLong(checkIn) },
                  { label: "Departure", value: formatDateLong(checkOut) },
                  { label: "Nights", value: nights > 0 ? String(nights) : "—" },
                  { label: "Lead guest", value: details.fullName || "—" },
                  { label: "Email", value: details.email || "—" },
                  { label: "Phone", value: details.phone || "—" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-1.5 border-b border-stone/60 pb-3">
                    <dt className="text-[0.66rem] uppercase tracking-[0.18em] text-charcoal/50">
                      {item.label}
                    </dt>
                    <dd className="text-[0.95rem] text-charcoal">{item.value}</dd>
                  </div>
                ))}
              </dl>

              {details.requests ? (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[0.66rem] uppercase tracking-[0.18em] text-charcoal/50">Requests</p>
                  <p className="text-[0.92rem] leading-relaxed text-charcoal/75">{details.requests}</p>
                </div>
              ) : null}

              <div className="flex flex-col gap-3">
                {chosenServices.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {chosenServices.map((service) => (
                      <li
                        key={service.id}
                        className="inline-flex items-center gap-1.5 border border-stone/80 px-3 py-1.5 text-[0.78rem] text-charcoal/75"
                      >
                        <Check aria-hidden="true" className="size-3 text-bronze" />
                        {service.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[0.82rem] text-charcoal/50">No guest services selected.</p>
                )}
              </div>

              <ConceptNotice tone="light" />
            </div>
          ) : null}

          {/* Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-stone/70 pt-6">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="inline-flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-charcoal/70 underline-offset-4 transition-opacity duration-300 hover:text-bronze hover:underline disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" />
              Back
            </button>

            {step < steps.length - 1 ? (
              <Button type="button" onClick={goNext} size="lg">
                Continue
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleConfirm} size="lg" loading={submitting}>
                {submitting ? "Confirming" : "Confirm demo reservation"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Live summary */}
      <aside className="lg:sticky lg:top-28 lg:h-fit">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 border border-stone/80 bg-canvas p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.16em] text-charcoal/50">
                  <CalendarDays aria-hidden="true" className="size-3" />
                  Arrival
                </span>
                <span className="text-[0.85rem] text-charcoal">{formatDateLong(checkIn)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.16em] text-charcoal/50">
                  <CalendarDays aria-hidden="true" className="size-3" />
                  Departure
                </span>
                <span className="text-[0.85rem] text-charcoal">{formatDateLong(checkOut)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.16em] text-charcoal/50">
                  <User aria-hidden="true" className="size-3" />
                  Guests
                </span>
                <span className="text-[0.85rem] text-charcoal">
                  {guests} {pluralize(guests, "guest")}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.16em] text-charcoal/50">
                  <Users aria-hidden="true" className="size-3" />
                  Apartment
                </span>
                <span className="text-[0.85rem] text-charcoal">{room ? room.name : "Not chosen"}</span>
              </div>
            </div>
          </div>

          <PriceSummary
            breakdown={breakdown}
            title="Live estimate"
            footer="Illustrative sample calculation. No payment is requested at any point."
          />
        </div>
      </aside>
    </div>
  );
}
