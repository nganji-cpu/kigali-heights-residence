import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { resolveServiceIcon } from "@/components/services/service-icon";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { pricingTypeLabels, services } from "@/data/services";
import { formatUSD } from "@/lib/utils";

const previewSlugs = [
  "airport-pickup",
  "in-residence-dining",
  "kigali-city-tours",
  "conference-support",
];

/** Compact grid of four guest services with a link to the full services page. */
export function ServicesPreview() {
  const preview = previewSlugs
    .map((slug) => services.find((service) => service.slug === slug))
    .filter((service): service is (typeof services)[number] => Boolean(service));

  return (
    <section className="border-b border-stone/70 bg-canvas py-20 lg:py-28">
      <div className="shell flex flex-col gap-12">
        <Reveal className="max-w-2xl">
          <SectionHeading
            eyebrow="Guest services"
            title="The small logistics, already arranged."
            description="Transport, dining, laundry and business support can be added to a stay in advance. Select what you need while reserving, and the concept concierge desk coordinates the rest."
          />
        </Reveal>

        <div className="grid gap-px border border-stone/80 bg-stone/70 sm:grid-cols-2 lg:grid-cols-4">
          {preview.map((service, index) => {
            const Icon = resolveServiceIcon(service.icon);
            return (
              <Reveal
                key={service.id}
                delay={index * 80}
                className="flex h-full flex-col gap-5 bg-white p-7"
              >
                <span className="flex size-11 items-center justify-center border border-bronze/30 text-bronze">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="font-display text-2xl leading-tight">{service.name}</h3>
                  <p className="text-[0.9rem] leading-relaxed text-charcoal/65">
                    {service.summary}
                  </p>
                </div>
                <p className="mt-auto flex items-baseline gap-2 border-t border-stone/70 pt-4">
                  <span className="font-display text-xl leading-none">
                    from {formatUSD(service.samplePrice)}
                  </span>
                  <span className="text-[0.68rem] uppercase tracking-[0.16em] text-charcoal/50">
                    {pricingTypeLabels[service.pricingType]} · sample
                  </span>
                </p>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={100}>
          <Link
            href="/services"
            className="group inline-flex items-center gap-2 text-[0.74rem] font-medium uppercase tracking-[0.19em] text-charcoal underline-offset-4 hover:text-bronze hover:underline"
          >
            See all guest services
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
