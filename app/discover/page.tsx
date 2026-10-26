import type { Metadata } from "next";
import Image from "next/image";
import { ConceptNotice } from "@/components/layout/concept-notice";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { destinationFacts, experienceSections } from "@/data/experiences";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Discover Kigali",
  description:
    "Impressions of Kigali and Rwanda for a stay at Kigali Heights Residence: the city, art and culture, food, nature escapes and business travel.",
};

export default function DiscoverPage() {
  return (
    <>
      <PageHeader
        eyebrow="Kigali & Rwanda"
        title="A city of hills, and a country close at hand."
        description="General impressions to help a guest plan their days: the city, its creative scene, its food, and the escapes within reach of Kigali. Nothing here is a recommendation of a specific venue."
        image={{
          src: "/images/kigali-hills.jpg",
          alt: "Green hills of Kigali seen from a viewpoint",
        }}
        meta={destinationFacts}
      />

      {experienceSections.map((section, index) => {
        const reversed = index % 2 === 1;
        return (
          <section
            key={section.id}
            id={section.id}
            className={cn(
              "scroll-mt-28 border-b border-stone/70 py-16 lg:py-24",
              index % 2 === 0 ? "bg-ivory" : "bg-canvas",
            )}
          >
            <div className="shell grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
              <Reveal className={cn("order-1 flex flex-col gap-6", reversed && "lg:order-2")}>
                <span className="eyebrow">{section.eyebrow}</span>
                <h2 className="font-display text-4xl leading-[1.06] tracking-[-0.01em] text-balance-tight sm:text-5xl">
                  {section.title}
                </h2>
                <p className="text-[1rem] leading-relaxed text-charcoal/70">{section.description}</p>
                {section.quote ? (
                  <blockquote className="border-l-2 border-bronze/50 pl-5 font-display text-xl italic leading-relaxed text-charcoal/80">
                    {section.quote}
                  </blockquote>
                ) : null}
              </Reveal>

              <Reveal
                delay={120}
                className={cn("order-2", reversed && "lg:order-1")}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="frame frame-zoom relative col-span-2 aspect-[16/10]">
                    <Image
                      src={section.images[0].src}
                      alt={section.images[0].alt}
                      fill
                      sizes="(min-width: 1024px) 45vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  {section.images.slice(1).map((image) => (
                    <div key={image.src} className="frame frame-zoom relative aspect-[4/3]">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(min-width: 1024px) 22vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>
        );
      })}

      <section className="bg-ivory py-16 lg:py-20">
        <div className="shell flex flex-col gap-8">
          <ConceptNotice tone="light" className="max-w-3xl" />
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/book" size="lg">
              Reserve a stay
            </ButtonLink>
            <ButtonLink href="/services" variant="secondary" size="lg">
              See guest services
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
