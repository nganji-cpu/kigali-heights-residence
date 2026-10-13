import { Suspense } from "react";
import type { Metadata } from "next";
import { ConceptNotice } from "@/components/layout/concept-notice";
import { PageHeader } from "@/components/layout/page-header";
import { BookingForm, type BookingInitialSelection } from "@/components/booking/booking-form";
import { getRoomBySlug } from "@/data/rooms";
import { MAX_GUESTS } from "@/lib/booking";
import { clamp, parseISODate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Reserve your stay",
  description:
    "A demonstration reservation flow for the fictional Kigali Heights Residence concept select dates, an apartment and guest services, then review an illustrative estimate.",
};

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function parseInitial(searchParams: Awaited<PageProps<"/book">["searchParams"]>): BookingInitialSelection {
  const roomParam = firstValue(searchParams.room);
  const room = roomParam ? getRoomBySlug(roomParam) : undefined;

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
  const initial = parseInitial(params);

  return (
    <div className="shell py-16 lg:py-20">
      <BookingForm initial={initial} />
    </div>
  );
}

export default function BookPage({ searchParams }: PageProps<"/book">) {
  return (
    <>
      <PageHeader
        eyebrow="Reserve"
        title={
          <>
            Plan the stay, then review an <em className="italic text-bronze">illustrative</em>{" "}
            estimate.
          </>
        }
        description="Four short steps: your dates and apartment, any guest services, your contact details, then a review. This is a demonstration flow  no payment details are requested and no reservation is created."
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
