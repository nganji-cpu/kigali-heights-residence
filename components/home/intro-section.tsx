import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const conceptFacts = [
  { value: "5", label: "Levels, from lobby to rooftop" },
  { value: "6", label: "Apartment and suite concepts" },
  { value: "24h", label: "Concierge and arrival support" },
];

/** Short introduction to the residence, set in an asymmetrical editorial split. */
export function IntroSection() {
  return (
    <section className="border-b border-stone/70 bg-canvas py-20 lg:py-28">
      <div className="shell grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-20">
        <Reveal className="flex flex-col gap-7">
          <SectionHeading
            eyebrow="The residence"
            title={
              <>
                Shaped around how people <em className="italic text-bronze">actually</em> travel.
              </>
            }
            description="Most stays in Kigali mix work and rest in the same week a meeting in the morning, a long lunch, a call at midnight in a different time zone. This concept arranges the building around that rhythm: quiet floors, generous apartments, and a concierge who is genuinely reachable."
          />

          <p className="max-w-xl text-[0.95rem] leading-relaxed text-charcoal/65">
            Five levels rise from an arrival lobby to a rooftop lounge. Between them sit standard,
            deluxe and executive apartments alongside a single penthouse residence each planned as
            a place to live for a few days or a few months, not simply to sleep.
          </p>

          <div>
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 text-[0.74rem] font-medium uppercase tracking-[0.19em] text-charcoal underline-offset-4 hover:text-bronze hover:underline"
            >
              Read the concept
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={120} className="flex flex-col gap-8">
          <div className="frame frame-zoom relative aspect-[5/4] w-full">
            <Image
              src="/images/lobby-lounge.jpg"
              alt="Guest lounge with soft seating, timber screens and warm evening lighting"
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover"
            />
          </div>

          <dl className="grid grid-cols-3 gap-6 border-t border-stone/70 pt-8">
            {conceptFacts.map((fact) => (
              <div key={fact.label} className="flex flex-col gap-2">
                <dt className="font-display text-4xl leading-none text-charcoal">{fact.value}</dt>
                <dd className="text-[0.78rem] leading-snug text-charcoal/60">{fact.label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
