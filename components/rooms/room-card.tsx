import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BedDouble, Maximize, Users } from "lucide-react";
import { categoryLabels } from "@/data/rooms";
import { formatUSD } from "@/lib/utils";
import type { Room } from "@/types";

interface RoomCardProps {
  room: Room;
  /** Pass true for above-the-fold cards to hint eager image loading. */
  priority?: boolean;
}

export function RoomCard({ room, priority = false }: RoomCardProps) {
  return (
    <article className="group flex h-full flex-col border border-stone/80 bg-white transition-shadow duration-500 hover:shadow-[var(--shadow-lift)]">
      <Link
        href={`/rooms/${room.slug}`}
        className="frame frame-zoom relative block aspect-[4/3]"
        aria-label={`View ${room.name}`}
      >
        <Image
          src={room.images[0]}
          alt={`${room.name} — ${room.summary}`}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
        <span className="absolute left-0 top-0 bg-ivory/92 px-3 py-2 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-charcoal backdrop-blur-sm">
          {categoryLabels[room.category]} · Level {room.floor}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex flex-col gap-2">
          <h3 className="font-display text-2xl leading-snug">
            <Link href={`/rooms/${room.slug}`} className="hover:text-bronze">
              {room.name}
            </Link>
          </h3>
          <p className="text-[0.9rem] leading-relaxed text-charcoal/65">{room.summary}</p>
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[0.78rem] text-charcoal/70">
          <li className="flex items-center gap-2">
            <Users aria-hidden="true" className="size-3.5 text-bronze" />
            <span>
              Up to {room.capacity} {room.capacity === 1 ? "guest" : "guests"}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Maximize aria-hidden="true" className="size-3.5 text-bronze" />
            <span>{room.size} m²</span>
          </li>
          <li className="flex items-center gap-2">
            <BedDouble aria-hidden="true" className="size-3.5 text-bronze" />
            <span>{room.bedType}</span>
          </li>
        </ul>

        <div className="mt-auto flex flex-col gap-4 border-t border-stone/70 pt-5">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-3xl leading-none text-charcoal">
              {formatUSD(room.pricePerNight)}
            </span>
            <span className="text-[0.75rem] uppercase tracking-[0.16em] text-charcoal/50">
              per night · sample
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href={`/rooms/${room.slug}`}
              className="group/link inline-flex items-center gap-1.5 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-charcoal underline-offset-4 hover:text-bronze hover:underline"
            >
              View details
              <ArrowUpRight
                aria-hidden="true"
                className="size-3.5 transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
              />
            </Link>
            <Link
              href={`/book?room=${room.slug}`}
              className="inline-flex items-center gap-1.5 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-bronze underline-offset-4 hover:underline"
            >
              Select room
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
