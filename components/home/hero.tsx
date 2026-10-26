import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <Image
        src="/images/hero-residence-dusk.jpg"
        alt="The residence at dusk, with warm light in the ground-floor lounge"
        fill
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink/82 via-ink/38 to-ink/10"
      />

      <div className="shell relative flex min-h-[78svh] flex-col justify-end pb-14 pt-36 lg:min-h-[86svh] lg:pb-20">
        <div className="fade-in flex max-w-2xl flex-col gap-6">
          <h1 className="font-display text-[2.9rem] leading-[1.02] tracking-[-0.02em] text-ivory text-balance-tight sm:text-6xl lg:text-[4.8rem]">
            A quiet place to stay in Kigali.
          </h1>

          <p className="max-w-xl text-[1rem] leading-relaxed text-ivory/78 sm:text-[1.08rem]">
            Six apartments with proper kitchens, room to work and a rooftop above the city.
          </p>

          <div className="flex flex-wrap items-center gap-x-7 gap-y-4 pt-2">
            <ButtonLink href="/rooms" variant="bronze" size="lg">
              Explore apartments
              <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 text-[0.86rem] font-medium text-ivory/80 underline-offset-4 transition-colors duration-300 hover:text-ivory hover:underline"
            >
              Discover the residence
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
