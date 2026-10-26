import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

/** The quiet final invitation on the homepage: look closer, then decide. */
export function ExploreCta() {
  return (
    <section className="bg-ink text-ivory">
      <div className="shell grid gap-10 py-20 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16 lg:py-24">
        <div className="flex max-w-2xl flex-col gap-5">
          <span className="eyebrow text-bronze-soft">A closer look</span>
          <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.015em] text-balance-tight text-ivory sm:text-5xl">
            See the whole building.
          </h2>
          <p className="max-w-xl text-[1rem] leading-relaxed text-ivory/65">
            Five levels, from the arrival lounge to the rooftop, and a separate look at how an
            immersive walkthrough could work.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-7 gap-y-4 lg:justify-end lg:pb-1">
          <ButtonLink href="/explore" variant="light">
            Explore the residence
          </ButtonLink>
          <Link
            href="/about"
            className="group inline-flex items-center gap-2 text-[0.84rem] font-medium text-ivory/75 underline-offset-4 hover:text-ivory hover:underline"
          >
            Read about the building
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
