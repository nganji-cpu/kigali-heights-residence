import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

/** Short introduction to the residence, set in an asymmetrical editorial split. */
export function IntroSection() {
  return (
    <section className="border-b border-stone/70 bg-canvas py-20 lg:py-28">
      <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-20">
        <Reveal className="flex flex-col gap-6">
          <span className="eyebrow">The residence</span>
          <h2 className="max-w-xl font-display text-4xl leading-[1.06] tracking-[-0.015em] text-balance-tight sm:text-5xl">
            A small building with room to settle in.
          </h2>
          <p className="max-w-lg text-[1rem] leading-relaxed text-charcoal/68">
            Six apartments above a quiet lobby, each with a kitchen, a proper desk and space to
            unpack. The rooftop is shared, the service is discreet, and the city is close when you
            want it.
          </p>
          <div>
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 text-[0.84rem] font-medium text-charcoal underline-offset-4 hover:text-bronze hover:underline"
            >
              Read about the residence
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="frame frame-zoom relative aspect-[5/4] w-full">
            <Image
              src="/images/lobby-lounge.jpg"
              alt="Guest lounge with soft seating, timber screens and warm evening light"
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
