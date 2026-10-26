import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { residenceLevels } from "@/data/levels";

export const metadata: Metadata = {
  title: "About the residence",
  description:
    "The idea behind Kigali Heights Residence, a design concept for six apartments in Kigali, Rwanda.",
};

const principles = [
  {
    title: "A residence, not a hotel",
    body: "Apartments are planned for living — cooking, working, hosting — so a stay of a week or a month feels settled rather than transient.",
  },
  {
    title: "Service that stays quiet",
    body: "The lobby is planned around a staffed desk. Beyond that, help is arranged in advance and then left alone.",
  },
  {
    title: "Built for the climate",
    body: "Deep balconies, cross-ventilation and shade are part of the plan, not add-ons. The building should stay comfortable in Kigali's light.",
  },
  {
    title: "Grounded in the city",
    body: "The design looks outward to Kigali — its hills, its makers and its food — rather than recreating an international hotel interior.",
  },
];

const projectNotes = [
  "The residence, its apartments and its services are a design concept, not a real property.",
  "Prices are illustrative estimates, not real tariffs.",
  "Availability and reservations are part of this project; no real apartment is held.",
  "No payment details are collected or processed.",
  "Photography is licensed stock imagery, not the residence itself.",
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="A residence designed around the way people stay."
        description="Kigali Heights Residence is a design concept for six apartments in Kigali, Rwanda. The idea is simple: a complete home, a quiet building and service that knows when to step in."
        image={{
          src: "/images/facade-modern-residential.jpg",
          alt: "Modern residential facade with planted balconies",
        }}
      />

      <section className="bg-ivory py-16 lg:py-24">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
          <Reveal className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="The idea"
              title="A concept shaped around stays that last longer than a night."
              description="For conferences, consulting engagements and relocations, a visit can stretch from a few days into weeks. A standard hotel room starts to feel like a compromise. This concept answers that with apartments that behave like homes: a kitchen that gets used, a desk that is properly lit, and a building that stays quiet at night."
            />
            <p className="text-[0.95rem] leading-relaxed text-charcoal/65">
              The building is arranged so that a guest can move from a first coffee in the lobby
              lounge to a quiet afternoon of work on level four, then finish on the rooftop without
              ever feeling they are in a transit space. That rhythm — arrival, work, rest, gathering
              — shapes every level of the plan.
            </p>
          </Reveal>

          <Reveal delay={120} className="grid grid-cols-2 gap-4">
            <div className="frame frame-zoom relative col-span-2 aspect-[16/10]">
              <Image
                src="/images/lobby-hall-couches.jpg"
                alt="Lobby hall with comfortable seating and warm materials"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="frame frame-zoom relative aspect-[4/5]">
              <Image
                src="/images/room-executive-loft.jpg"
                alt="Executive suite with a canopy bed and soft lighting"
                fill
                sizes="(min-width: 1024px) 22vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="frame frame-zoom relative aspect-[4/5]">
              <Image
                src="/images/kitchen-apartment.jpg"
                alt="Apartment kitchen with a stone counter and open shelving"
                fill
                sizes="(min-width: 1024px) 22vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-stone/70 bg-canvas py-16 lg:py-24">
        <div className="shell flex flex-col gap-12">
          <Reveal className="max-w-2xl">
            <SectionHeading eyebrow="Principles" title="Four ideas the concept is built on." />
          </Reveal>

          <div className="grid gap-x-14 sm:grid-cols-2">
            {principles.map((principle, index) => (
              <Reveal
                key={principle.title}
                delay={index * 80}
                className="flex gap-5 border-t border-stone/70 py-7"
              >
                <span className="w-7 shrink-0 pt-1 text-[0.72rem] text-bronze">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="font-display text-2xl leading-tight">{principle.title}</h3>
                  <p className="text-[0.9rem] leading-relaxed text-charcoal/65">{principle.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="scroll-mt-28 bg-ivory py-16 lg:py-24">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16">
          <Reveal className="order-2 lg:order-1">
            <div className="frame frame-zoom relative aspect-[4/3]">
              <Image
                src="/images/stairs-tate.jpg"
                alt="Sculptural interior stairs connecting the levels"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          <Reveal delay={120} className="order-1 flex flex-col gap-7 lg:order-2">
            <SectionHeading
              eyebrow="Architecture"
              title="Five floors, one material language."
              description="From the double-height arrival lobby to the rooftop lounge, the plan keeps to warm stone, timber and light, so the building reads as one home rather than a stack of unrelated floors."
            />
            <ol className="flex flex-col divide-y divide-stone/70 border-y border-stone/70">
              {residenceLevels.map((level) => (
                <li key={level.level} className="flex items-baseline gap-5 py-4">
                  <span className="font-display text-2xl leading-none text-bronze">
                    L{level.level}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="font-display text-xl leading-tight">{level.name}</span>
                    <span className="text-[0.85rem] leading-relaxed text-charcoal/70">
                      {level.tagline}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <div>
              <ButtonLink href="/explore" variant="secondary">
                Explore the levels
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-stone/70 bg-canvas py-16 lg:py-24">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <SectionHeading
            eyebrow="A note on this project"
            title="What is real, and what is not."
            description="Kigali Heights Residence is a design concept. A few things are worth stating plainly."
          />

          <div className="flex flex-col gap-8">
            <ul className="flex flex-col divide-y divide-stone/70 border-y border-stone/70">
              {projectNotes.map((item) => (
                <li key={item} className="flex items-start gap-3 py-4 text-[0.92rem] text-charcoal/75">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-bronze" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href="/credits" variant="secondary">
                Image credits
              </ButtonLink>
              <ButtonLink href="/contact">Ask a question</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
