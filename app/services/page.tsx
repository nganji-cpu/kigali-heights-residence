import type { Metadata } from "next";
import { ConceptNotice } from "@/components/layout/concept-notice";
import { PageHeader } from "@/components/layout/page-header";
import { ServicePlanner } from "@/components/services/service-planner";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { services } from "@/data/services";

export const metadata: Metadata = {
  title: "Guest services",
  description:
    "Optional transport, dining, lifestyle and business services for a fictional Kigali apartment residence concept, with illustrative sample prices.",
};

const steps = [
  {
    number: "01",
    title: "Choose what you need",
    body: "Select any services from the list. They are remembered in this browser so you can come back to them.",
  },
  {
    number: "02",
    title: "Add them while reserving",
    body: "The reservation flow picks up your selection and folds it into the estimate, calculated against your nights and guests.",
  },
  {
    number: "03",
    title: "The desk coordinates",
    body: "In a real property, the concierge would confirm each item. Here the step is simulated no request is actually sent.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Guest services"
        title={
          <>
            The logistics of a stay, <em className="italic text-bronze">handled quietly</em>.
          </>
        }
        description="Arrival transfers, private dining, laundry and business support can all be arranged before you arrive. Select the ones you would like prices are illustrative estimates used to demonstrate the reservation flow."
        image={{
          src: "/images/dining-table.jpg",
          alt: "A dining table set for a private in-residence meal",
        }}
        meta={[
          { label: "Categories", value: "4" },
          { label: "Services", value: `${services.length}` },
          { label: "Pricing", value: "Illustrative" },
          { label: "Arranged", value: "In advance" },
          { label: "Contact", value: "Concierge desk" },
          { label: "Added", value: "At reservation" },
        ]}
      >
        <ButtonLink href="/book">Start a reservation</ButtonLink>
        <ButtonLink href="/contact" variant="secondary">
          Ask the concierge
        </ButtonLink>
      </PageHeader>

      <section className="bg-ivory py-16 lg:py-20">
        <div className="shell">
          <ServicePlanner services={services} />
        </div>
      </section>

      <section className="border-t border-stone/70 bg-canvas py-16 lg:py-20">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <SectionHeading
            eyebrow="How it works"
            title="Three steps, no forms to chase."
            description="Service selection is deliberately lightweight: choose here, confirm while reserving, and the concept concierge desk takes it from there."
          />

          <ol className="flex flex-col divide-y divide-stone/70 border-y border-stone/70">
            {steps.map((step) => (
              <li key={step.number} className="flex gap-6 py-6">
                <span className="font-display text-3xl leading-none text-bronze">{step.number}</span>
                <div className="flex flex-col gap-2">
                  <h3 className="font-display text-2xl leading-tight">{step.title}</h3>
                  <p className="text-[0.92rem] leading-relaxed text-charcoal/65">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-stone/70 bg-ivory py-16 lg:py-20">
        <div className="shell flex flex-col gap-8">
          <ConceptNotice tone="light" className="max-w-3xl" />
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/book" size="lg">
              Continue to reservation
            </ButtonLink>
            <ButtonLink href="/rooms" variant="secondary" size="lg">
              Choose an apartment
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
