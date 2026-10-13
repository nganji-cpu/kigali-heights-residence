import { BookingSearchPanel } from "@/components/booking/booking-search-panel";
import { ConceptNotice } from "@/components/layout/concept-notice";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/data/site";

/** Closing section: a short pitch plus the inline availability search. */
export function ReservationCta() {
  return (
    <section className="bg-canvas py-20 lg:py-28">
      <div className="shell flex flex-col gap-12">
        <Reveal className="max-w-2xl">
          <SectionHeading
            eyebrow="Reserve"
            title="Start with your dates, shape the rest later."
            description="Choose an arrival and departure, then pick an apartment and any guest services in the reservation flow. Everything you select is summarised as you go  no account, and no payment details are ever requested."
          />
        </Reveal>

        <Reveal delay={100}>
          <BookingSearchPanel variant="inline" />
        </Reveal>

        <Reveal delay={140} className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-md text-[0.85rem] leading-relaxed text-charcoal/60">
            Prefer to ask first? The concierge desk handles group stays, long assignments and
            special requests reach us at{" "}
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="text-charcoal underline underline-offset-4 hover:text-bronze"
            >
              {siteConfig.contact.email}
            </a>
            .
          </p>
          <ConceptNotice tone="light" className="max-w-xl" />
        </Reveal>
      </div>
    </section>
  );
}
