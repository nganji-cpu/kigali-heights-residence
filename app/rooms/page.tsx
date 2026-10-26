import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/page-header";
import { RoomsBrowser } from "@/components/rooms/rooms-browser";
import { ButtonLink } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/status-message";
import { isRoomCategory } from "@/data/rooms";
import { listRooms } from "@/lib/server/repository";
import type { Room, RoomCategory } from "@/types";

export const metadata: Metadata = {
  title: "Apartments & suites",
  description:
    "Six apartments and suites across four guest floors, from a compact city apartment to the penthouse. A design concept for apartment living in Kigali, Rwanda.",
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

  await connection();

  let rooms: Room[] = [];
  try {
    rooms = await listRooms({
      category: category === "all" ? undefined : category,
      level: level === "all" ? undefined : level,
    });
  } catch (error) {
    console.error("Failed to load apartments from the database:", error);
    return (
      <div className="shell py-16 lg:py-20">
        <StatusMessage
          tone="error"
          title="The apartments could not be loaded"
          className="max-w-3xl"
        >
          Please try again in a moment. The rest of the residence is still available to explore.
        </StatusMessage>
        <div className="mt-6">
          <ButtonLink href="/rooms" variant="secondary">
            Try again
          </ButtonLink>
        </div>
      </div>
    );
  }

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
        eyebrow="Apartments"
        title="Six apartments, from a compact city home to the penthouse."
        description="Each apartment is a complete home rather than a room: cooking, working and living spaces arranged with intention. Filter by type or building level to compare them side by side."
        image={{
          src: "/images/lounge-modern.jpg",
          alt: "Contemporary apartment lounge with layered lighting",
        }}
      >
        <ButtonLink href="/book">Reserve a stay</ButtonLink>
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
