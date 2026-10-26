import type { Metadata } from "next";
import { ConceptNotice } from "@/components/layout/concept-notice";
import { PageHeader } from "@/components/layout/page-header";
import { AluTour } from "@/components/explore/alu-tour";
import { ResidenceExplorer } from "@/components/explore/residence-explorer";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { residenceLevels } from "@/data/levels";

export const metadata: Metadata = {
  title: "Explore the residence",
  description:
    "A walk through the five levels of Kigali Heights Residence, from the arrival lounge and apartments to the executive floor, penthouse and rooftop.",
};

export default function ExplorePage() {
  return (
    <>
      <PageHeader
        eyebrow="Explore"
        title="A walk through the building, from the lobby to the rooftop."
        description="Select a level to read what sits on it and see the apartments that belong to it. The elevation is an architectural illustration, not a photograph."
        image={{
          src: "/images/facade-modern-residential.jpg",
          alt: "Facade of the residence with planted terraces",
        }}
      >
        <ButtonLink href="/rooms">Browse apartments</ButtonLink>
        <ButtonLink href="/book" variant="secondary">
          Reserve a stay
        </ButtonLink>
      </PageHeader>

      <section className="bg-ivory py-16 lg:py-20">
        <div className="shell">
          <h2 className="sr-only">Interactive level explorer</h2>
          <ResidenceExplorer />
        </div>
      </section>

      <section className="border-t border-stone/70 bg-canvas py-16 lg:py-20">
        <div className="shell flex flex-col gap-8">
          <SectionHeading
            eyebrow="ALU Kigali360"
            title="A live campus walkthrough."
            description="The tour below is the public ALU Kigali360 campus tour, not Kigali Heights Residence. It is included as a reference for how an immersive walkthrough could feel."
          />
          <AluTour />
        </div>
      </section>

      <section className="border-t border-stone/70 bg-canvas py-16 lg:py-20">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <SectionHeading
            eyebrow="The five levels"
            title="One idea per level."
            description="Each level has a clear character: a quiet desk on level four, a long lunch on the rooftop, a slow coffee in the level-one lounge."
          />

          <ol className="flex flex-col divide-y divide-stone/70 border-y border-stone/70">
            {residenceLevels.map((level) => (
              <li key={level.level} className="flex gap-5 py-5">
                <span className="w-8 shrink-0 pt-1 text-[0.72rem] text-bronze">
                  {String(level.level).padStart(2, "0")}
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

      <section className="border-t border-stone/70 bg-ivory py-10">
        <div className="shell">
          <ConceptNotice tone="light" className="max-w-3xl" />
        </div>
      </section>
    </>
  );
}
