import type { Metadata } from "next";
import { ConceptNotice } from "@/components/layout/concept-notice";
import { PageHeader } from "@/components/layout/page-header";
import { ContactForm } from "@/components/contact/contact-form";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Send a question about Kigali Heights Residence, a design concept for apartment living in Kigali, Rwanda.",
};

const faqs = [
  {
    question: "Is this a real hotel I can book?",
    answer:
      "No. Kigali Heights Residence is a design concept, not an operating property. Nothing shown here represents real availability or a real reservation.",
  },
  {
    question: "Can I use these prices?",
    answer:
      "The rates are illustrative estimates for the concept. They are not tariffs and should not be relied on.",
  },
  {
    question: "What happens when I send a message?",
    answer:
      "The message is saved as part of this project. There is no live team monitoring the inbox, so a reply is not guaranteed and no booking is created.",
  },
  {
    question: "Why is the ALU tour on the Explore page?",
    answer:
      "It is the public ALU Kigali360 campus tour, included as a reference for how an immersive walkthrough could feel. It is not Kigali Heights Residence and does not show these apartments.",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Questions about the residence."
        description="For anything from a single apartment question to a longer stay, send a note. This is a design concept, so messages are saved as part of the project rather than answered by a live team."
        image={{
          src: "/images/coffee-shop.jpg",
          alt: "A calm coffee bar interior where guests might meet",
        }}
      >
        <ButtonLink href="/book">Reserve a stay</ButtonLink>
        <ButtonLink href="/rooms" variant="secondary">
          Browse apartments
        </ButtonLink>
      </PageHeader>

      <section className="bg-ivory py-16 lg:py-24">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
          <div className="flex flex-col gap-8">
            <SectionHeading
              eyebrow="Send a message"
              title="Tell us what you need."
              description="Dates, party size and the nature of the trip are useful context. Every message is recorded with the name and email you provide here."
            />
            <ContactForm />
          </div>

          <aside className="flex flex-col gap-8">
            <div className="flex flex-col gap-6 border-y border-stone/80 py-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-[0.68rem] text-charcoal/70">Location</span>
                <span className="font-display text-2xl">
                  {siteConfig.location.city}, {siteConfig.location.country}
                </span>
                <span className="text-[0.82rem] leading-relaxed text-charcoal/70">
                  No street address or public telephone number is published for this design
                  concept.
                </span>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-stone/70 pt-5">
                <span className="text-[0.68rem] text-charcoal/70">Response</span>
                <span className="text-[0.88rem] leading-relaxed text-charcoal/70">
                  The form is the only contact route. Messages are stored, but the inbox is not
                  monitored.
                </span>
              </div>
            </div>

            <ConceptNotice tone="light" detailed />
          </aside>
        </div>
      </section>

      <section className="border-t border-stone/70 bg-canvas py-16 lg:py-24">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <SectionHeading
            eyebrow="Common questions"
            title="Before you write."
            description="A few things worth knowing about the project behind this website."
          />

          <div className="flex flex-col divide-y divide-stone/70 border-y border-stone/70">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-xl leading-snug text-charcoal marker:content-none">
                  {faq.question}
                  <span
                    aria-hidden="true"
                    className="text-lg leading-none text-bronze transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
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
