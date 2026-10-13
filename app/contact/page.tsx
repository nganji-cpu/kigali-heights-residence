import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { ConceptNotice } from "@/components/layout/concept-notice";
import { PageHeader } from "@/components/layout/page-header";
import { ContactForm } from "@/components/contact/contact-form";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact the fictional Kigali Heights Residence concept  a demonstration form and concept-only contact details for a design study.",
};

const faqs = [
  {
    question: "Is this a real hotel I can book?",
    answer:
      "No. Kigali Heights Residence is a fictional concept created as a design and development study. Nothing shown here represents a real property, real availability or a real reservation.",
  },
  {
    question: "Can I use these prices?",
    answer:
      "The prices are illustrative estimates used to demonstrate how a reservation summary might work. They are not tariffs and should not be relied on.",
  },
  {
    question: "What happens if I submit the form?",
    answer:
      "Nothing is sent anywhere. The form validates your input locally and shows a confirmation so the interaction can be reviewed  no message leaves the browser.",
  },
  {
    question: "Can a Spline 3D scene be added?",
    answer:
      "Yes. The Explore page viewer is built to accept a Spline scene URL through an environment variable; until one is configured it shows a designed architectural illustration instead.",
  },
];

const contactItems = [
  {
    icon: MapPin,
    label: "Location",
    value: `${siteConfig.location.district}, ${siteConfig.location.city}, ${siteConfig.location.country}`,
    note: siteConfig.location.addressLine,
  },
  {
    icon: Phone,
    label: "Telephone",
    value: siteConfig.contact.phone,
    note: siteConfig.contact.phoneNote,
  },
  {
    icon: Mail,
    label: "Email",
    value: siteConfig.contact.email,
    note: siteConfig.contact.emailNote,
  },
  {
    icon: Clock,
    label: "Concierge hours",
    value: siteConfig.contact.hours,
    note: "Illustrative — the property is not operating.",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title={
          <>
            Questions, group stays and <em className="italic text-bronze">long assignments</em>.
          </>
        }
        description="Use the form for anything from a single reservation question to a relocation enquiry. Everything on this page is part of a demonstration, so replies are simulated rather than sent."
        image={{
          src: "/images/coffee-shop.jpg",
          alt: "A calm coffee bar interior where guests might meet",
        }}
      >
        <ButtonLink href="/book">Start a reservation</ButtonLink>
        <ButtonLink href="/services" variant="secondary">
          Browse guest services
        </ButtonLink>
      </PageHeader>

      <section className="bg-ivory py-16 lg:py-24">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
          <div className="flex flex-col gap-8">
            <SectionHeading
              eyebrow="Send a message"
              title="Tell us what you need."
              description="The more context you give dates, party size, the nature of the trip the easier it is to demonstrate how the concierge desk would respond."
            />
            <ContactForm />
          </div>

          <aside className="flex flex-col gap-8">
            <div className="flex flex-col divide-y divide-stone/70 border border-stone/80 bg-white">
              {contactItems.map((item) => (
                <div key={item.label} className="flex items-start gap-4 p-6">
                  <span className="flex size-10 shrink-0 items-center justify-center border border-bronze/30 text-bronze">
                    <item.icon aria-hidden="true" className="size-4" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-[0.64rem] uppercase tracking-[0.18em] text-charcoal/50">
                      {item.label}
                    </span>
                    <span className="text-[0.95rem] text-charcoal">{item.value}</span>
                    <span className="text-[0.74rem] text-charcoal/50">{item.note}</span>
                  </div>
                </div>
              ))}
            </div>

            <ConceptNotice tone="light" />
          </aside>
        </div>
      </section>

      <section className="border-t border-stone/70 bg-canvas py-16 lg:py-24">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <SectionHeading
            eyebrow="Common questions"
            title="Before you write."
            description="A few things worth knowing about the prototype behind this website."
          />

          <div className="flex flex-col divide-y divide-stone/70 border-y border-stone/70">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-xl leading-snug text-charcoal marker:content-none">
                  {faq.question}
                  <MessageSquare
                    aria-hidden="true"
                    className="size-4 shrink-0 text-bronze transition-transform duration-300 group-open:rotate-90"
                  />
                </summary>
                <p className="pt-3 text-[0.92rem] leading-relaxed text-charcoal/70">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
