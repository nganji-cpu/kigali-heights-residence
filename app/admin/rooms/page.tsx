import Image from "next/image";
import { connection } from "next/server";
import { AdminPageHeader, StatusBadge } from "@/components/admin/admin-ui";
import { RoomStatusControl } from "@/components/admin/room-status-control";
import { categoryLabels } from "@/data/rooms";
import { listRooms } from "@/lib/server/repository";
import { formatUSD } from "@/lib/utils";

export const instant = false;

export default async function AdminRoomsPage() {
  await connection();
  const rooms = await listRooms({ includeUnavailable: true });

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        eyebrow="Apartments"
        title="Apartment availability."
        description="Only apartments marked available appear on the public site and can be booked. Change a status to take an apartment out of circulation without deleting its history."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {rooms.map((room) => (
          <article key={room.id} className="flex flex-col border border-stone/80 bg-white">
            <div className="relative aspect-[16/10] w-full bg-stone/30">
              <Image
                src={room.images[0] ?? "/images/room-standard.jpg"}
                alt={room.name}
                fill
                sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="font-display text-xl leading-tight">{room.name}</h2>
                  <p className="text-[0.72rem] text-charcoal/60">
                    {categoryLabels[room.category]} · Level {room.floor} · Sleeps {room.capacity}
                  </p>
                </div>
                <StatusBadge status={room.status ?? "available"} />
              </div>

              <p className="text-[0.8rem] leading-relaxed text-charcoal/65">{room.summary}</p>

              <div className="mt-auto flex items-end justify-between gap-4 border-t border-stone/60 pt-4">
                <p className="text-[0.8rem] text-charcoal/70">
                  {formatUSD(room.pricePerNight)}
                  <span className="text-[0.68rem]"> / night</span>
                </p>
                <RoomStatusControl slug={room.slug} status={room.status ?? "available"} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
