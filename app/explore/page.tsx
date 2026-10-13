import type { Metadata } from "next";
import { Layers } from "lucide-react";
import { ConceptNotice } from "@/components/layout/concept-notice";
import { PageHeader } from "@/components/layout/page-header";
import { ResidenceExplorer } from "@/components/explore/residence-explorer";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { residenceLevels } from "@/data/levels";

export const metadata: Metadata = {
  title: "Explore the residence",
  description:
    "An interactive walkthrough of the fictional five-level Kigali Heights Residence concept arrival lounge, apartments, executive floor, penthouse and rooftop.",
};

const conceptFacts = [
  { value: "5", label: "Levels, lobby to rooftop" },
  { value: "6", label: "Apartment and suite concepts" },
  { value: "145 m²", label: "Largest residence" },
  { value: "24h", label: "Concept concierge desk" },
];

export default function ExplorePage() {
  return (
    <>
      <PageHeader
        eyebrow="Explore"
        title={
          <>
            A walk through the building, from the <em className="italic text-bronze">lobby</em> to
            the rooftop.
          </>
        }
        description="Select a level to read what sits on it and see the apartments that belong to it. When a Spline scene is connected, this viewer becomes an interactive 3D model; until then it shows a designed architectural elevation."
        image={{
          src: "/images/facade-modern-residential.jpg",
          alt: "Facade of the concept residence with planted terraces",
        }}
      >
        <ButtonLink href="/rooms">Browse apartments</ButtonLink>
        <ButtonLink href="/book" variant="secondary">
          Reserve your stay
        </ButtonLink>
      </PageHeader>

      <section className="bg-ivory py-16 lg:py-20">
        <div className="shell">
          <ResidenceExplorer />
        </div>
      </section>

      <section className="border-t border-stone/70 bg-canvas py-16 lg:py-20">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <SectionHeading
            eyebrow="How it is organised"
            title="One idea per level."
            description="The concept stacks the stay so that each level has a clear character. Guests move between them for what they need rather than for status  a quiet desk on level four, a long lunch on the rooftop, a slow coffee in the level-one lounge."
          />

          <ol className="flex flex-col divide-y divide-stone/70 border-y border-stone/70">
            {residenceLevels.map((level) => (
              <li key={level.level} className="flex gap-5 py-5">
                <span className="flex size-11 shrink-0 items-center justify-center border border-bronze/30 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-bronze">
                  <Layers aria-hidden="true" className="size-4" />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-display text-2xl leading-tight">
                    Level {level.level} — {level.name}
                  </h3>
                  <p className="text-[0.92rem] leading-relaxed text-charcoal/65">{level.tagline}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-stone/70 bg-ivory py-16 lg:py-20">
        <div className="shell flex flex-col gap-10">
          <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {conceptFacts.map((fact) => (
              <div key={fact.label} className="flex flex-col gap-2 border-t border-stone/70 pt-6">
                <dt className="font-display text-4xl leading-none text-charcoal">{fact.value}</dt>
                <dd className="text-[0.8rem] leading-snug text-charcoal/60">{fact.label}</dd>
              </div>
            ))}
          </dl>

          <ConceptNotice tone="light" className="max-w-3xl" />
        </div>
      </section>
    </>
  );
}
