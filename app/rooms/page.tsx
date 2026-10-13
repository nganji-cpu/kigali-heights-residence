import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { RoomsBrowser } from "@/components/rooms/rooms-browser";
import { ButtonLink } from "@/components/ui/button";
import { isRoomCategory, rooms } from "@/data/rooms";
import type { RoomCategory } from "@/types";

export const metadata: Metadata = {
  title: "Apartments & suites",
  description:
    "Six fictional apartment and suite concepts across five levels standard, deluxe, executive and penthouse. Illustrative sample rates shown.",
};

function parseCategory(value: string | string[] | undefined): RoomCategory | "all" {
  const raw = Array.isArray(value) ? value[0] : value;
  return isRoomCategory(raw) ? raw : "all";
}

/** Only levels two to five hold apartments, so level one is not a filter option. */
function parseLevel(value: string | string[] | undefined): 2 | 3 | 4 | 5 | "all" {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw ? Number(raw) : Number.NaN;
  return parsed === 2 || parsed === 3 || parsed === 4 || parsed === 5 ? parsed : "all";
}

/** Placeholder shown while the filtered results stream in at request time. */
function RoomsResultsFallback() {
  return (
    <div className="shell py-16">
      <div className="flex flex-col gap-6" role="status" aria-label="Loading apartments">
        <div className="h-28 w-full animate-pulse bg-stone/40" />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="h-96 w-full animate-pulse bg-stone/30" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function RoomsResults({
  searchParams,
}: Pick<PageProps<"/rooms">, "searchParams">) {
  const params = await searchParams;
  const category = parseCategory(params.category);
  const level = parseLevel(params.level);

  return (
    <div className="shell py-16 lg:py-20">
      <RoomsBrowser rooms={rooms} initialCategory={category} initialLevel={level} />
    </div>
  );
}

export default function RoomsPage({ searchParams }: PageProps<"/rooms">) {
  return (
    <>
      <PageHeader
        eyebrow="Accommodation"
        title={
          <>
            Six apartments, from a compact <em className="italic text-bronze">city studio</em> to
            the penthouse.
          </>
        }
        description="Each apartment is a complete home rather than a room: cooking, working and living spaces arranged with intention. Filter by type or building level to compare them side by side."
        image={{
          src: "/images/lounge-modern.jpg",
          alt: "Contemporary apartment lounge with layered lighting",
        }}
        meta={[
          { label: "Apartments", value: "6 concepts" },
          { label: "Levels", value: "2 – 5" },
          { label: "Sleeps", value: "2 – 4 guests" },
          { label: "Sizes", value: "42 – 145 m²" },
          { label: "Rates", value: "Sample, in USD" },
          { label: "Beds", value: "Queen to king" },
        ]}
      >
        <ButtonLink href="/book">Reserve your stay</ButtonLink>
        <ButtonLink href="/explore" variant="secondary">
          Explore by level
        </ButtonLink>
      </PageHeader>

      <Suspense fallback={<RoomsResultsFallback />}>
        <RoomsResults searchParams={searchParams} />
      </Suspense>
    </>
  );
}
