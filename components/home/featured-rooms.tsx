import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RoomCard } from "@/components/rooms/room-card";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { getFeaturedRooms, lowestRate } from "@/data/rooms";
import { formatUSD } from "@/lib/utils";

/** Three signature apartments pulled from the shared room data. */
export function FeaturedRooms() {
  const featured = getFeaturedRooms(3);

  return (
    <section className="border-b border-stone/70 bg-canvas py-20 lg:py-28">
      <div className="shell flex flex-col gap-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal className="max-w-2xl">
            <SectionHeading
              eyebrow="Accommodation"
              title={
                <>
                  Apartments built for staying <em className="italic text-bronze">properly</em>,
                  not just overnight.
                </>
              }
              description="Every apartment is planned around a real week or month of living a place to work, cook, host and rest, with the quiet of a residential building rather than a hotel corridor."
            />
          </Reveal>

          <Reveal delay={120} className="shrink-0">
            <div className="flex flex-col gap-4 lg:items-end">
              <p className="flex items-baseline gap-2 lg:justify-end">
                <span className="text-[0.72rem] uppercase tracking-[0.18em] text-charcoal/50">
                  Sample rates from
                </span>
                <span className="font-display text-2xl leading-none">
                  {formatUSD(lowestRate)}
                </span>
              </p>
              <Link
                href="/rooms"
                className="group inline-flex items-center gap-2 text-[0.74rem] font-medium uppercase tracking-[0.19em] text-charcoal underline-offset-4 hover:text-bronze hover:underline"
              >
                View all {featured.length > 0 ? "six" : ""} apartments
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </Reveal>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
