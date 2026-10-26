import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { ConceptNotice } from "@/components/layout/concept-notice";
import { RoomCard } from "@/components/rooms/room-card";
import { RoomGallery } from "@/components/rooms/room-gallery";
import { RoomReserveCard } from "@/components/rooms/room-reserve-card";
import { ButtonLink } from "@/components/ui/button";
import {
  categoryLabels,
  getAllRoomSlugs,
  getRoomBySlug as getStaticRoom,
} from "@/data/rooms";
import { getLevel } from "@/data/levels";
import {
  getRelatedRooms as getRelatedRoomsFromDb,
  getRoomBySlug as getRoomBySlugFromDb,
} from "@/lib/server/repository";
import { pluralize } from "@/lib/utils";

export function generateStaticParams() {
  return getAllRoomSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/rooms/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const room = getStaticRoom(slug);

  if (!room) {
    return {
      title: "Apartment not found",
      description: "This apartment is not part of the residence.",
    };
  }

  return {
    title: room.name,
    description: room.summary,
    openGraph: {
      title: room.name,
      description: room.summary,
      images: [{ url: room.images[0] }],
    },
  };
}

function RoomDetailFallback() {
  return (
    <div className="shell py-16" role="status" aria-label="Loading apartment">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="aspect-[16/11] w-full animate-pulse bg-stone/40" />
        <div className="h-96 w-full animate-pulse bg-stone/30" />
      </div>
    </div>
  );
}

async function RoomDetail({ params }: Pick<PageProps<"/rooms/[slug]">, "params">) {
  const { slug } = await params;
  await connection();
  const room = await getRoomBySlugFromDb(slug);

  if (!room) {
    notFound();
  }

  const level = getLevel(room.floor);
  const related = await getRelatedRoomsFromDb(room.slug, 3);

  const specs = [
    { label: "Sleeps", value: `Up to ${room.capacity} ${pluralize(room.capacity, "guest")}` },
    { label: "Interior", value: `${room.size} m²` },
    { label: "Bedding", value: room.bedType },
    { label: "View", value: room.view },
  ];

  return (
    <article>
      {/* Breadcrumb */}
      <div className="border-b border-stone/70 bg-canvas">
        <nav aria-label="Breadcrumb" className="shell py-5">
          <ol className="flex flex-wrap items-center gap-2 text-[0.72rem] text-charcoal/70">
            <li>
              <Link href="/" className="hover:text-bronze">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/rooms" className="hover:text-bronze">
                Apartments
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-charcoal">
              {room.name}
            </li>
          </ol>
        </nav>
      </div>

      <div className="shell py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-16">
          {/* Main column */}
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-7">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.74rem] text-charcoal/70">
                <span>{categoryLabels[room.category]}</span>
                <span aria-hidden="true">·</span>
                <Link
                  href={`/rooms?level=${room.floor}`}
                  className="underline-offset-4 transition-colors duration-300 hover:text-bronze hover:underline"
                >
                  Level {room.floor}, {level.name}
                </Link>
              </div>

              <div className="flex flex-col gap-4">
                <h1 className="font-display text-[2.5rem] leading-[1.04] tracking-[-0.01em] text-balance-tight sm:text-6xl">
                  {room.name}
                </h1>
                <p className="max-w-2xl text-[1.05rem] leading-relaxed text-charcoal/70">
                  {room.summary}
                </p>
              </div>
            </div>

            <RoomGallery images={room.images} roomName={room.name} />

            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <h2 className="font-display text-3xl">About this apartment</h2>
                <p className="max-w-3xl text-[1rem] leading-relaxed text-charcoal/75">
                  {room.description}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-x-8 gap-y-5 border-y border-stone/80 py-6 sm:grid-cols-4">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex flex-col gap-1.5">
                    <dt className="text-[0.68rem] text-charcoal/70">{spec.label}</dt>
                    <dd className="font-display text-lg leading-tight text-charcoal">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex flex-col gap-6">
              <h2 className="font-display text-3xl">What is included</h2>
              <ul className="grid gap-x-8 border-t border-stone/80 sm:grid-cols-2 lg:grid-cols-3">
                {room.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="border-b border-stone/70 py-3 text-[0.9rem] text-charcoal/75"
                  >
                    {amenity}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-5 border-t border-stone/80 pt-8">
              <h2 className="font-display text-3xl">Where this apartment sits</h2>
              <p className="max-w-2xl text-[0.95rem] leading-relaxed text-charcoal/70">
                {level.description}
              </p>
              <div className="flex flex-wrap items-center gap-5 pt-1">
                <ButtonLink href="/explore" variant="secondary">
                  Explore the building
                </ButtonLink>
                <Link
                  href="/rooms"
                  className="group inline-flex items-center gap-2 text-[0.78rem] font-medium text-charcoal underline-offset-4 hover:text-bronze hover:underline"
                >
                  <ArrowLeft
                    aria-hidden="true"
                    className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
                  />
                  Back to all apartments
                </Link>
              </div>
            </div>

            <ConceptNotice tone="light" detailed />
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <RoomReserveCard room={room} />
          </aside>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 ? (
        <section className="border-t border-stone/70 bg-canvas py-16 lg:py-20">
          <div className="shell flex flex-col gap-10">
            <h2 className="font-display text-3xl sm:text-4xl">Other apartments to consider</h2>

            <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id} className="h-full">
                  <RoomCard room={item} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </article>
  );
}

export default function RoomPage({ params }: PageProps<"/rooms/[slug]">) {
  return (
    <Suspense fallback={<RoomDetailFallback />}>
      <RoomDetail params={params} />
    </Suspense>
  );
}
