import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { RoomCard } from "@/components/rooms/room-card";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusMessage } from "@/components/ui/status-message";
import { listRooms } from "@/lib/server/repository";
import type { Room } from "@/types";

/** Skeleton used while the featured apartments stream from the database. */
export function FeaturedRoomsFallback() {
  return (
    <section
      className="border-b border-stone/70 bg-canvas py-20 lg:py-28"
      role="status"
      aria-label="Loading featured apartments"
    >
      <div className="shell flex flex-col gap-12">
        <div className="h-24 w-full max-w-2xl animate-pulse bg-stone/30" />
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-96 w-full animate-pulse bg-stone/25" />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Three signature apartments, read from the same database as /rooms. */
export async function FeaturedRooms() {
  await connection();

  let featured: Room[] = [];

  try {
    featured = await listRooms({ featuredOnly: true, limit: 3 });
  } catch (error) {
    console.error("Failed to load featured apartments from the database:", error);
    return (
      <section className="border-b border-stone/70 bg-canvas py-20 lg:py-28">
        <div className="shell">
          <StatusMessage tone="info" title="The apartments are temporarily unavailable.">
            Please try the full apartment list, or come back in a moment.
          </StatusMessage>
          <div className="mt-6">
            <ButtonLink href="/rooms" variant="secondary">
              View apartments
            </ButtonLink>
          </div>
        </div>
      </section>
    );
  }

  if (featured.length === 0) return null;

  return (
    <section className="border-b border-stone/70 bg-canvas py-20 lg:py-28">
      <div className="shell flex flex-col gap-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal className="max-w-2xl">
            <SectionHeading
              eyebrow="Apartments"
              title="Three apartments to start with."
              description="Each apartment has a kitchen, a place to work and a different view of the city."
            />
          </Reveal>

          <Reveal delay={120} className="shrink-0">
            <Link
              href="/rooms"
              className="group inline-flex items-center gap-2 text-[0.84rem] font-medium text-charcoal underline-offset-4 hover:text-bronze hover:underline"
            >
              View all six apartments
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </Reveal>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((room, index) => (
            <Reveal key={room.id} delay={index * 90} className="h-full">
              <RoomCard room={room} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
