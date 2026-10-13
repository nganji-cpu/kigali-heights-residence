import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const principles = [
  {
    title: "Stone, timber and light",
    body: "Warm local stone and timber sit against large openings, so the building reads as domestic rather than corporate.",
  },
  {
    title: "Deep, shaded balconies",
    body: "Every apartment opens outward. Balconies are cut deep enough to sit in during the middle of the day.",
  },
  {
    title: "Cross-ventilated floors",
    body: "Each level is planned for air movement from both sides, keeping the residence comfortable without relying on cooling alone.",
  },
];

const gallery = [
  { src: "/images/stairs-tate.jpg", alt: "Sculptural interior stair with soft daylight" },
  { src: "/images/lobby-hall-couches.jpg", alt: "Lobby hall with timber and stone detailing" },
  { src: "/images/facade-modern-residential.jpg", alt: "Modern residential facade with planted edges" },
];

/** Editorial architecture feature with a stacked image pair and a small gallery. */
export function ArchitectureShowcase() {
  return (
    <section className="border-b border-stone/70 bg-ivory py-20 lg:py-28">
      <div className="shell grid gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-20">
        <Reveal className="order-2 flex flex-col gap-8 lg:order-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="frame frame-zoom relative col-span-2 aspect-[16/10]">
              <Image
                src="/images/facade-night.jpg"
                alt="The residence facade at night with lit apartment windows"
                fill
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="frame frame-zoom relative aspect-[4/5]">
              <Image
                src="/images/balcony-view.jpg"
                alt="A deep balcony with shaded seating overlooking the city"
                fill
                sizes="(min-width: 1024px) 21vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="frame frame-zoom relative aspect-[4/5]">
              <Image
                src="/images/apartment-block.jpg"
                alt="Apartment block with terraces and planted screens"
                fill
                sizes="(min-width: 1024px) 21vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </Reveal>

        <Reveal delay={120} className="order-1 flex flex-col gap-8 lg:order-2">
          <SectionHeading
            eyebrow="Architecture"
            title="A five-level building designed to feel residential."
            description="The concept borrows from Kigali's hillside houses rather than from hotel architecture: a contained footprint, generous terraces, and materials that age warmly. Level one gathers the arrival and social spaces; levels two to five step up in privacy, ending with a single penthouse under the rooftop lounge."
          />

          <ul className="flex flex-col divide-y divide-stone/70 border-y border-stone/70">
            {principles.map((principle) => (
              <li key={principle.title} className="flex flex-col gap-2 py-5">
                <h3 className="font-display text-2xl leading-tight">{principle.title}</h3>
                <p className="text-[0.92rem] leading-relaxed text-charcoal/65">{principle.body}</p>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-4">
              {gallery.map((item) => (
                <div key={item.src} className="frame relative aspect-square">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(min-width: 1024px) 14vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            <div>
              <Link
                href="/explore"
                className="group inline-flex items-center gap-2 text-[0.74rem] font-medium uppercase tracking-[0.19em] text-charcoal underline-offset-4 hover:text-bronze hover:underline"
              >
                Walk through all five levels
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
