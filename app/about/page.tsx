import type { Metadata } from "next";
import Image from "next/image";
import { Compass, HeartHandshake, Layers, Leaf } from "lucide-react";
import { ConceptNotice } from "@/components/layout/concept-notice";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { residenceLevels } from "@/data/levels";
import { rooms } from "@/data/rooms";
import { services } from "@/data/services";

export const metadata: Metadata = {
  title: "About the concept",
  description:
    "The idea behind the fictional Kigali Heights Residence concept a five-level apartment residence designed as a design and development study.",
};

const principles = [
  {
    icon: Layers,
    title: "A residence, not a hotel",
    body: "Apartments are planned for living  cooking, working, hosting  so a stay of a week or a month feels settled rather than transient.",
  },
  {
    icon: HeartHandshake,
    title: "Service that stays quiet",
    body: "The concierge desk is genuinely reachable but never intrusive. Help is arranged in advance and then left to work in the background.",
  },
  {
    icon: Leaf,
    title: "Built for the climate",
    body: "Deep balconies, cross-ventilation and shade are treated as design decisions, not add-ons, so the building sits comfortably in Kigali's light.",
  },
  {
    icon: Compass,
    title: "Grounded in the city",
    body: "The concept looks outward to Kigali  its hills, its makers and its food  rather than recreating an international hotel interior.",
  },
];

const simulated = [
  "The residence, its apartments and its services are fictional.",
  "All prices are illustrative estimates, not real tariffs.",
  "Availability and the reservation flow are demonstrations.",
  "No payment details are ever collected or processed.",
  "Photography is licensed placeholder imagery, not the concept itself.",
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title={
          <>
            A design study in apartment hospitality for <em className="italic text-bronze">Kigali</em>.
          </>
        }
        description="Kigali Heights Residence is a fictional concept created to explore how a five-level apartment residence might feel for business travellers, conference guests and longer stays. It is presented as a working front-end prototype, not an operating property."
        image={{
          src: "/images/facade-modern-residential.jpg",
          alt: "Modern residential facade with planted balconies",
        }}
        meta={[
          { label: "Concept", value: "Apartment residence" },
          { label: "Levels", value: `${residenceLevels.length}` },
          { label: "Apartments", value: `${rooms.length} concepts` },
          { label: "Services", value: `${services.length} optional` },
          { label: "Location", value: "Kigali, Rwanda" },
          { label: "Status", value: "Fictional study" },
        ]}
      />

      <section className="bg-ivory py-16 lg:py-24">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
          <Reveal className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="The idea"
              title="Most visitors to Kigali are staying for more than a night."
              description="Conferences, consulting engagements and relocations mean stays stretch from a few days into weeks. A standard hotel room starts to feel like a compromise. This concept answers that with apartments that behave like homes — a kitchen that gets used, a desk that is properly lit, and neighbours who are mostly away at work."
            />
            <p className="text-[0.95rem] leading-relaxed text-charcoal/65">
              The building is arranged so that a guest can move from a first coffee in the lobby
              lounge to a quiet afternoon of work on level four, then finish on the rooftop without
              ever feeling they are in a transit space. That rhythm — arrival, work, rest, gathering
              shapes every level of the plan.
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
                src="/images/spa-treatment.jpg"
                alt="Calm wellness treatment room with natural textures"
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
            <SectionHeading
              eyebrow="Principles"
              title="Four ideas the concept is built on."
            />
          </Reveal>

          <div className="grid gap-px border border-stone/80 bg-stone/70 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((principle, index) => (
              <Reveal
                key={principle.title}
                delay={index * 80}
                className="flex h-full flex-col gap-5 bg-white p-7"
              >
                <span className="flex size-11 items-center justify-center border border-bronze/30 text-bronze">
                  <principle.icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="font-display text-2xl leading-tight">{principle.title}</h3>
                <p className="text-[0.9rem] leading-relaxed text-charcoal/65">{principle.body}</p>
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
              title="Five levels, one continuous idea."
              description="From the double-height arrival lobby to the rooftop lounge, the plan keeps a single material language  warm stone, timber and light  so the building reads as one home rather than a stack of unrelated floors."
            />
            <ol className="flex flex-col divide-y divide-stone/70 border-y border-stone/70">
              {residenceLevels.map((level) => (
                <li key={level.level} className="flex items-baseline gap-5 py-4">
                  <span className="font-display text-2xl leading-none text-bronze">
                    L{level.level}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="font-display text-xl leading-tight">{level.name}</span>
                    <span className="text-[0.85rem] leading-relaxed text-charcoal/60">
                      {level.tagline}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <div>
              <ButtonLink href="/explore" variant="secondary">
                Explore the levels interactively
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-stone/70 bg-canvas py-16 lg:py-24">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <SectionHeading
            eyebrow="Prototype notes"
            title="What is real, and what is not."
            description="This project is an exploration of interface and content design. To keep it honest, the following is deliberately explicit."
          />

          <div className="flex flex-col gap-8">
            <ul className="flex flex-col divide-y divide-stone/70 border-y border-stone/70">
              {simulated.map((item) => (
                <li key={item} className="flex items-start gap-3 py-4 text-[0.92rem] text-charcoal/75">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-bronze" />
                  {item}
                </li>
              ))}
            </ul>
            <ConceptNotice tone="light" />
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
