import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

const rooftopPoints = [
  "Open terrace arranged for sunset light",
  "Small plunge pool and shaded seating",
  "Private dining and small gatherings on request",
  "Direct access from the penthouse residence",
];

/** Full-bleed dark feature for the level five rooftop lounge. */
export function RooftopFeature() {
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <Image
        src="/images/rooftop-bar-night.jpg"
        alt="Rooftop lounge glowing at night above the city skyline"
        fill
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink/92 via-ink/70 to-ink/45"
      />

      <div className="shell relative py-24 lg:py-32">
        <Reveal className="flex max-w-2xl flex-col gap-7">
          <span className="eyebrow text-bronze-soft">Level five</span>
          <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.01em] text-ivory text-balance-tight sm:text-5xl lg:text-[3.6rem]">
            The rooftop is where the residence exhales.
          </h2>
          <p className="max-w-xl text-[1rem] leading-relaxed text-ivory/75">
            Above the penthouse, a lounge and open terrace look across Kigali&apos;s hills. It is
            planned as the building&apos;s shared room: a place for a slow morning coffee, an
            evening drink, or a small private dinner with the city below.
          </p>

          <ul className="flex flex-col gap-2.5 border-t border-ivory/15 pt-6">
            {rooftopPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-[0.92rem] text-ivory/80">
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-bronze-soft" />
                {point}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <ButtonLink href="/rooms/penthouse-residence" variant="bronze" size="lg">
              See the penthouse residence
              <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
            <ButtonLink href="/explore" variant="light" size="lg">
              Explore level five
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
