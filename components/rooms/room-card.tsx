import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categoryLabels } from "@/data/rooms";
import { formatUSD } from "@/lib/utils";
import type { Room } from "@/types";

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
  return (
    <article className="group flex h-full flex-col">
      <Link
        href={`/rooms/${room.slug}`}
        className="frame frame-zoom relative block aspect-[4/3]"
        aria-label={`View ${room.name}`}
      >
        <Image
          src={room.images[0]}
          alt={`${room.name} — ${room.summary}`}
          fill
          loading="lazy"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-4 pt-5">
        <div className="flex flex-col gap-1.5">
          <p className="text-[0.72rem] text-charcoal/70">
            {categoryLabels[room.category]} · Level {room.floor}
          </p>
          <h3 className="font-display text-2xl leading-snug">
            <Link href={`/rooms/${room.slug}`} className="hover:text-bronze">
              {room.name}
            </Link>
          </h3>
          <p className="text-[0.9rem] leading-relaxed text-charcoal/65">{room.summary}</p>
        </div>

        <p className="text-[0.78rem] text-charcoal/70">
          Sleeps {room.capacity} · {room.size} m² · {room.bedType}
        </p>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-stone/70 pt-4">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-2xl leading-none text-charcoal">
              {formatUSD(room.pricePerNight)}
            </span>
            <span className="text-[0.72rem] text-charcoal/70">per night</span>
          </p>
          <Link
            href={`/rooms/${room.slug}`}
            className="group/link inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-charcoal underline-offset-4 hover:text-bronze hover:underline"
          >
            View apartment
            <ArrowUpRight
              aria-hidden="true"
              className="size-3.5 transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
