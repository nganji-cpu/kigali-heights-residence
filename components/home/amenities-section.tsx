import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { getRoomMeta } from "@/lib/server/repository";

/**
 * The short amenity list on the homepage. Names are read from the same
 * `amenities` table used by every apartment, so this section cannot drift from
 * the room detail pages.
 */
const preferredAmenities = [
  "Full kitchen",
  "High-speed Wi-Fi",
  "Work desk",
  "Daily housekeeping",
  "Private balcony",
  "Direct rooftop access",
];

export function AmenitiesFallback() {
  return (
    <section
      className="border-b border-stone/70 bg-ivory py-20 lg:py-28"
      role="status"
      aria-label="Loading apartment amenities"
    >
      <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="h-44 w-full max-w-md animate-pulse bg-stone/25" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="h-12 animate-pulse bg-stone/20" />
          ))}
        </div>
      </div>
    </section>
  );
}

export async function AmenitiesSection() {
  await connection();

  let amenities: string[] = [];

  try {
    const meta = await getRoomMeta();
    const available = new Set(meta.amenities);
    amenities = preferredAmenities.filter((name) => available.has(name));
  } catch (error) {
    console.error("Failed to load amenities from the database:", error);
    return null;
  }

  if (amenities.length === 0) return null;

  return (
    <section className="border-b border-stone/70 bg-ivory py-20 lg:py-28">
      <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-20">
        <Reveal className="flex flex-col gap-6 lg:sticky lg:top-28">
          <span className="eyebrow">In the apartments</span>
          <h2 className="max-w-lg font-display text-4xl leading-[1.06] tracking-[-0.015em] text-balance-tight sm:text-5xl">
            The essentials are already there.
          </h2>
          <p className="max-w-md text-[1rem] leading-relaxed text-charcoal/68">
            Kitchenettes in the studios and full kitchens in the larger apartments. A proper desk,
            reliable internet and housekeeping in every one.
          </p>
          <div>
            <Link
              href="/rooms"
              className="group inline-flex items-center gap-2 text-[0.84rem] font-medium text-charcoal underline-offset-4 hover:text-bronze hover:underline"
            >
              See what each apartment includes
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <ul className="grid border-t border-stone/80 sm:grid-cols-2 sm:gap-x-10">
            {amenities.map((amenity) => (
              <li
                key={amenity}
                className="border-b border-stone/70 py-5 text-[1.02rem] text-charcoal"
              >
                {amenity}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
