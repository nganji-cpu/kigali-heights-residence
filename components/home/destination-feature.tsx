import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { destinationFacts } from "@/data/experiences";

const collage = [
  { src: "/images/kigali-aerial.jpg", alt: "Kigali seen from above, spread across green hills" },
  { src: "/images/kigali-hills.jpg", alt: "Layered green hills around Kigali" },
  { src: "/images/kigali-market.jpg", alt: "Market stalls in the city" },
  { src: "/images/kigali-mount-sunset.jpg", alt: "Sunset over the hills beyond the city" },
];

/** Destination section introducing Kigali and linking to the /discover page. */
export function DestinationFeature() {
  return (
    <section className="border-b border-stone/70 bg-ivory py-20 lg:py-28">
      <div className="shell grid gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-20">
        <Reveal className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Kigali"
            title={
              <>
                A city of hills, and a country that is <em className="italic text-bronze">small
                enough</em> to explore.
              </>
            }
            description="Guests come to Kigali for work and stay for the city itself green districts at different heights, a fast-growing creative scene, and a countryside of volcanoes and lake shores within a few hours."
          />

          <dl className="grid grid-cols-2 gap-x-8 gap-y-6 border-t border-stone/70 pt-8 sm:grid-cols-3">
            {destinationFacts.map((fact) => (
              <div key={fact.label} className="flex flex-col gap-1.5">
                <dt className="text-[0.66rem] uppercase tracking-[0.2em] text-charcoal/50">
                  {fact.label}
                </dt>
                <dd className="font-display text-lg leading-tight text-charcoal">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div>
            <Link
              href="/discover"
              className="group inline-flex items-center gap-2 text-[0.74rem] font-medium uppercase tracking-[0.19em] text-charcoal underline-offset-4 hover:text-bronze hover:underline"
            >
              Discover Kigali with us
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="grid grid-cols-2 gap-4">
            <div className="frame frame-zoom relative col-span-2 aspect-[16/9]">
              <Image
                src={collage[0].src}
                alt={collage[0].alt}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            {collage.slice(1).map((item) => (
              <div key={item.src} className="frame frame-zoom relative aspect-[4/3]">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 1024px) 22vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
