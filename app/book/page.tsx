import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { ConceptNotice } from "@/components/layout/concept-notice";
import { PageHeader } from "@/components/layout/page-header";
import { BookingForm, type BookingInitialSelection } from "@/components/booking/booking-form";
import { ButtonLink } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/status-message";
import { MAX_GUESTS } from "@/lib/booking";
import { listRooms, listServices } from "@/lib/server/repository";
import { clamp, parseISODate } from "@/lib/utils";
import type { Room, Service } from "@/types";

export const metadata: Metadata = {
  title: "Reserve your stay",
  description:
    "Choose dates, an apartment and any guest services, then review the total before you reserve. A design concept for apartment living in Kigali, Rwanda.",
};

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function parseInitial(
  searchParams: Awaited<PageProps<"/book">["searchParams"]>,
  rooms: Room[],
): BookingInitialSelection {
  const roomParam = firstValue(searchParams.room);
  const room = roomParam ? rooms.find((item) => item.slug === roomParam) : undefined;

  const rawCheckIn = firstValue(searchParams.checkIn);
  const rawCheckOut = firstValue(searchParams.checkOut);
  const guestsParam = Number(firstValue(searchParams.guests));

  return {
    roomSlug: room?.slug ?? null,
    checkIn: parseISODate(rawCheckIn) ? rawCheckIn : "",
    checkOut: parseISODate(rawCheckOut) ? rawCheckOut : "",
    guests: Number.isFinite(guestsParam) && guestsParam >= 1 ? clamp(Math.round(guestsParam), 1, MAX_GUESTS) : 2,
  };
}

function BookingFallback() {
  return (
    <div className="shell py-16" role="status" aria-label="Loading reservation form">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="h-[36rem] w-full animate-pulse bg-stone/30" />
        <div className="h-96 w-full animate-pulse bg-stone/30" />
      </div>
    </div>
  );
}

async function BookingContent({ searchParams }: Pick<PageProps<"/book">, "searchParams">) {
  const params = await searchParams;

  await connection();

  let rooms: Room[];
  let services: Service[];

  try {
    [rooms, services] = await Promise.all([listRooms(), listServices()]);
  } catch (error) {
    console.error("Failed to load booking data from the database:", error);
    return (
      <div className="shell py-16 lg:py-20">
        <StatusMessage
          tone="error"
          title="The reservation form is unavailable"
          className="max-w-3xl"
        >
          Please try again in a moment. No booking has been created.
        </StatusMessage>
        <div className="mt-6">
          <ButtonLink href="/book" variant="secondary">
            Try again
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="shell py-16 lg:py-20">
        <StatusMessage
          tone="info"
          title="No apartments are available to book"
          className="max-w-3xl"
        >
          Please check back soon, or browse the apartments in the meantime.
        </StatusMessage>
      </div>
    );
  }

  const initial = parseInitial(params, rooms);

  return (
    <div className="shell py-16 lg:py-20">
      <BookingForm initial={initial} rooms={rooms} services={services} />
    </div>
  );
}

export default function BookPage({ searchParams }: PageProps<"/book">) {
  return (
    <>
      <PageHeader
        eyebrow="Reserve"
        title="Reserve your stay."
        description="Choose your dates and apartment, add any services you need, then review the total before you confirm. No payment details are requested and no payment is taken."
        image={{
          src: "/images/room-deluxe.jpg",
          alt: "Warmly lit apartment living area prepared for arrival",
        }}
      />

      <Suspense fallback={<BookingFallback />}>
        <BookingContent searchParams={searchParams} />
      </Suspense>

      <section className="border-t border-stone/70 bg-canvas py-12">
        <div className="shell">
          <ConceptNotice tone="light" detailed className="max-w-4xl" />
        </div>
      </section>
    </>
  );
}
