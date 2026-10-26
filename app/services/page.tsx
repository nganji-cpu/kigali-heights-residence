import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { ConceptNotice } from "@/components/layout/concept-notice";
import { PageHeader } from "@/components/layout/page-header";
import { ServicePlanner } from "@/components/services/service-planner";
import { ServiceRequestForm } from "@/components/services/service-request-form";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusMessage } from "@/components/ui/status-message";
import { listServices } from "@/lib/server/repository";
import type { Service } from "@/types";

export const metadata: Metadata = {
  title: "Guest services",
  description:
    "Airport transfers, private dining, laundry and business support for a stay at Kigali Heights Residence, a design concept for apartment living in Kigali, Rwanda.",
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
    title: "Or add them afterwards",
    body: "Already have a booking? Enter its reference below and attach a service. The request is recorded against the booking and the total updates to include it.",
  },
];

function ServicesFallback() {
  return (
    <section className="bg-ivory py-16 lg:py-20" role="status" aria-label="Loading services">
      <div className="shell">
        <div className="h-[30rem] w-full animate-pulse bg-stone/30" />
      </div>
    </section>
  );
}

async function ServicesContent() {
  await connection();

  let services: Service[];

  try {
    services = await listServices();
  } catch (error) {
    console.error("Failed to load guest services from the database:", error);
    return (
      <section className="bg-ivory py-16 lg:py-20">
        <div className="shell">
          <StatusMessage
            tone="error"
            title="The service list could not be loaded"
            className="max-w-3xl"
          >
            Please try again in a moment.
          </StatusMessage>
          <div className="mt-6">
            <ButtonLink href="/services" variant="secondary">
              Try again
            </ButtonLink>
          </div>
        </div>
      </section>
    );
  }

  if (services.length === 0) {
    return (
      <section className="bg-ivory py-16 lg:py-20">
        <div className="shell">
          <StatusMessage
            tone="info"
            title="No guest services are available"
            className="max-w-3xl"
          >
            Please check back soon, or continue with the apartments.
          </StatusMessage>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-ivory py-16 lg:py-20">
        <div className="shell">
          <h2 className="sr-only">Available guest services</h2>
          <ServicePlanner services={services} />
        </div>
      </section>

      <section className="border-t border-stone/70 bg-canvas py-16 lg:py-20">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <SectionHeading
            eyebrow="How it works"
            title="Choose now, confirm later, or add it afterwards."
            description="Service selection is deliberately light: pick what you need here, confirm it during booking, or attach it to a reservation you already hold."
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

      <section
        id="request-service"
        className="scroll-mt-24 border-t border-stone/70 bg-ivory py-16 lg:py-20"
      >
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Already reserved"
              title={
                <>
                  Add a service to an existing booking.
                </>
              }
              description="Enter the reference printed on your confirmation, choose a service, and it will be recorded against that booking."
            />
            <ul className="flex flex-col gap-3 border-t border-stone/70 pt-6 text-[0.88rem] leading-relaxed text-charcoal/65">
              <li>The reference and service are checked before anything is added.</li>
              <li>The booking total is recalculated from the current service rates.</li>
              <li>Requests are marked <strong className="font-medium text-charcoal">requested</strong> rather than confirmed.</li>
            </ul>
          </div>

          <ServiceRequestForm services={services} />
        </div>
      </section>

      <section className="border-t border-stone/70 bg-canvas py-16 lg:py-20">
        <div className="shell flex flex-col gap-8">
          <ConceptNotice tone="light" className="max-w-3xl" />
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/book" size="lg">
              Reserve a stay
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

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Guest services"
        title={
          <>
            The parts of a stay that need arranging.
          </>
        }
        description="Arrival transfers, private dining, laundry and business support can all be arranged around your stay. Select what you need now and it will carry through to your booking."
        image={{
          src: "/images/dining-table.jpg",
          alt: "A dining table set for a private in-residence meal",
        }}
      >
        <ButtonLink href="/book">Reserve a stay</ButtonLink>
        <ButtonLink href="#request-service" variant="secondary">
          Add to an existing booking
        </ButtonLink>
      </PageHeader>

      <Suspense fallback={<ServicesFallback />}>
        <ServicesContent />
      </Suspense>
    </>
  );
}
