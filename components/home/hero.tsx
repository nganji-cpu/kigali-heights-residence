import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { BookingSearchPanel } from "@/components/booking/booking-search-panel";
import { siteConfig } from "@/data/site";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <Image
        src="/images/hero-residence-dusk.jpg"
        alt="The residence at blue hour, with warm interior light spilling from the ground-floor lounge"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-ink/78 via-ink/50 to-ink/85"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-transparent"
      />

      <div className="shell relative flex min-h-[88svh] flex-col justify-end gap-10 pt-24 pb-14 lg:min-h-[92svh] lg:gap-14 lg:pb-20">
        <div className="fade-in flex max-w-3xl flex-col gap-6">
          <p className="eyebrow text-bronze-soft">
            {siteConfig.location.city} · {siteConfig.location.country}
          </p>

          <h1 className="font-display text-[2.85rem] leading-[1.02] tracking-[-0.015em] text-ivory text-balance-tight sm:text-6xl lg:text-[4.75rem]">
            A more thoughtful way to stay in <em className="italic text-bronze-soft">Kigali</em>.
          </h1>

          <p className="max-w-xl text-[1rem] leading-relaxed text-ivory/80 sm:text-[1.08rem]">
            A five-level apartment residence concept for business travellers, conference guests and
            anyone staying long enough to want a home rather than a room private, quiet, and a
            short drive from the city&apos;s working districts.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <ButtonLink href="/explore" variant="bronze" size="lg">
              Explore the residence
              <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
            <ButtonLink href="/rooms" variant="light" size="lg">
              Discover our rooms
            </ButtonLink>
          </div>
        </div>

        <BookingSearchPanel variant="hero" className="rise-in w-full max-w-5xl" />
      </div>
    </section>
  );
}
