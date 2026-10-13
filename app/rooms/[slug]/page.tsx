import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  Check,
  Layers,
  Maximize,
  Eye,
  Users,
} from "lucide-react";
import { ConceptNotice } from "@/components/layout/concept-notice";
import { RoomCard } from "@/components/rooms/room-card";
import { RoomGallery } from "@/components/rooms/room-gallery";
import { RoomReserveCard } from "@/components/rooms/room-reserve-card";
import { ButtonLink } from "@/components/ui/button";
import { categoryLabels, getAllRoomSlugs, getRelatedRooms, getRoomBySlug } from "@/data/rooms";
import { getLevel } from "@/data/levels";
import { formatUSD, pluralize } from "@/lib/utils";

export function generateStaticParams() {
  return getAllRoomSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/rooms/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const room = getRoomBySlug(slug);

  if (!room) {
    return {
      title: "Apartment not found",
      description: "This apartment does not exist in the concept residence.",
    };
  }

  return {
    title: room.name,
    description: room.summary,
    openGraph: {
      title: `${room.name}  sample concept apartment`,
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
  const room = getRoomBySlug(slug);

  if (!room) {
    notFound();
  }

  const level = getLevel(room.floor);
  const related = getRelatedRooms(room.slug, 3);

  const specs = [
    { icon: Users, label: "Sleeps", value: `Up to ${room.capacity} ${pluralize(room.capacity, "guest")}` },
    { icon: Maximize, label: "Interior", value: `${room.size} m²` },
    { icon: BedDouble, label: "Bedding", value: room.bedType },
    { icon: Eye, label: "View", value: room.view },
  ];

  return (
    <article>
      {/* Breadcrumb */}
      <div className="border-b border-stone/70 bg-canvas">
        <nav aria-label="Breadcrumb" className="shell py-5">
          <ol className="flex flex-wrap items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em] text-charcoal/55">
            <li>
              <Link href="/" className="hover:text-bronze">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/rooms" className="hover:text-bronze">
                Accommodation
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
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-charcoal px-3 py-1.5 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-ivory">
                  {categoryLabels[room.category]}
                </span>
                <Link
                  href={`/rooms?level=${room.floor}`}
                  className="inline-flex items-center gap-1.5 border border-stone/90 px-3 py-1.5 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-charcoal/70 transition-colors duration-300 hover:border-bronze hover:text-bronze"
                >
                  <Layers aria-hidden="true" className="size-3" />
                  Level {room.floor}
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

              <dl className="grid grid-cols-2 gap-px border border-stone/80 bg-stone/70 sm:grid-cols-4">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex flex-col gap-2 bg-white p-5">
                    <dt className="flex items-center gap-2 text-[0.64rem] uppercase tracking-[0.18em] text-charcoal/50">
                      <spec.icon aria-hidden="true" className="size-3.5 text-bronze" />
                      {spec.label}
                    </dt>
                    <dd className="font-display text-lg leading-tight text-charcoal">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex flex-col gap-6">
              <h2 className="font-display text-3xl">In every {categoryLabels[room.category]} apartment</h2>
              <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                {room.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-start gap-2.5 text-[0.9rem] text-charcoal/75">
                    <Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-bronze" />
                    {amenity}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-5 border border-stone/80 bg-canvas p-6 sm:p-7">
              <h2 className="flex items-center gap-2.5 font-display text-2xl">
                <Building2 aria-hidden="true" className="size-5 text-bronze" />
                Where this apartment sits
              </h2>
              <p className="text-[0.95rem] leading-relaxed text-charcoal/70">{level.description}</p>
              <div className="flex flex-wrap items-center gap-3">
                <ButtonLink href={`/explore`} variant="secondary">
                  Explore level {room.floor}
                </ButtonLink>
                <Link
                  href="/rooms"
                  className="group inline-flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-charcoal underline-offset-4 hover:text-bronze hover:underline"
                >
                  <ArrowLeft
                    aria-hidden="true"
                    className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
                  />
                  Back to all apartments
                </Link>
              </div>
            </div>

            <ConceptNotice tone="light" />
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <RoomReserveCard room={room} />
          </aside>
        </div>
      </div>

      {/* Related */}
      <section className="border-t border-stone/70 bg-canvas py-16 lg:py-20">
        <div className="shell flex flex-col gap-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl sm:text-4xl">Other apartments to consider</h2>
            <p className="text-[0.78rem] uppercase tracking-[0.16em] text-charcoal/50">
              From {formatUSD(Math.min(...related.map((item) => item.pricePerNight)))} per night
            </p>
          </div>

          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.id} className="h-full">
                <RoomCard room={item} />
              </li>
            ))}
          </ul>
        </div>
      </section>
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
