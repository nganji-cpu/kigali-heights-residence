import { ArrowRight, Layers } from "lucide-react";
import { BuildingDiagram } from "@/components/explore/building-diagram";
import { SplineScene, SplineStatus } from "@/components/explore/spline-scene";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { residenceLevels } from "@/data/levels";

const levelStrip = residenceLevels.map((level) => ({
  level: level.level,
  name: level.name,
}));

/** Dark section introducing the interactive explorer and the 3D Scene slot. */
export function ExplorePreview() {
  return (
    <section className="border-b border-ivory/10 bg-ink py-20 text-ivory lg:py-28">
      <div className="shell grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-20">
        <Reveal className="flex flex-col gap-7">
          <span className="eyebrow text-bronze-soft">Explore the residence</span>
          <h2 className="font-display text-4xl leading-[1.06] tracking-[-0.01em] text-ivory text-balance-tight sm:text-5xl lg:text-6xl">
            Move through the building, one level at a time.
          </h2>
          <p className="max-w-xl text-[1rem] leading-relaxed text-ivory/70">
            The interactive walkthrough describes what sits on each of the five levels from the
            arrival lounge to the penthouse and rooftop  and links each level to the apartments
            that belong to it.
          </p>

          <ul className="flex flex-col gap-2.5 border-y border-ivory/12 py-6">
            {levelStrip.map((entry) => (
              <li key={entry.level} className="flex items-baseline gap-4 text-[0.92rem]">
                <span className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-bronze-soft">
                  <Layers aria-hidden="true" className="size-3.5" />
                  Level {entry.level}
                </span>
                <span className="text-ivory/75">{entry.name}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/explore" variant="bronze" size="lg">
              Open the interactive explorer
              <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
            <ButtonLink href="/rooms" variant="light" size="lg">
              Compare apartments
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={120} className="flex flex-col gap-5">
          <SplineScene
            className="relative aspect-[4/3] w-full border border-ivory/12 sm:aspect-[16/11]"
            fallback={<BuildingDiagram activeLevel={5} />}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SplineStatus />
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-ivory/45">
              Concept preview
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
