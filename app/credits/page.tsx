import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { creditLicenses, imageCredits } from "@/data/credits";

export const metadata: Metadata = {
  title: "Image credits",
  description:
    "Licence attributions for the Wikimedia Commons photography used in the fictional Kigali Heights Residence concept prototype.",
};

export default function CreditsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Credits"
        title={
          <>
            Photography <em className="italic text-bronze">attributions</em>.
          </>
        }
        description="Every photograph in this prototype is a licensed placeholder sourced from Wikimedia Commons and used under the licence shown. The images illustrate the concept only; none of them depict a real Kigali Heights Residence."
      >
        <ButtonLink href="/images/ATTRIBUTIONS.md" variant="secondary">
          Open the plain-text list
        </ButtonLink>
        <ButtonLink href="/about" variant="secondary">
          About the concept
        </ButtonLink>
      </PageHeader>

      <section className="bg-ivory py-16 lg:py-20">
        <div className="shell flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow={`${imageCredits.length} images`}
              title="Licences in use"
              description="Creative Commons licences require attribution and, for the share-alike variants, that derivative works carry the same licence. Full links to each source file are listed below."
            />
            <ul className="flex flex-wrap gap-2">
              {creditLicenses.map((license) => (
                <li
                  key={license}
                  className="border border-stone/90 px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.14em] text-charcoal/70"
                >
                  {license}
                </li>
              ))}
            </ul>
          </div>

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {imageCredits.map((credit) => (
              <li
                key={credit.file}
                className="flex gap-4 border border-stone/80 bg-white p-4"
              >
                <div className="frame relative size-20 shrink-0">
                  <Image
                    src={credit.file}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <p className="line-clamp-2 text-[0.85rem] leading-snug text-charcoal">
                    {credit.title}
                  </p>
                  <p className="text-[0.75rem] text-charcoal/60">{credit.author}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[0.68rem] uppercase tracking-[0.14em] text-bronze">
                      {credit.license}
                    </span>
                    <Link
                      href={credit.source}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group inline-flex items-center gap-1 text-[0.72rem] text-charcoal/60 underline-offset-4 hover:text-bronze hover:underline"
                    >
                      Source
                      <ExternalLink
                        aria-hidden="true"
                        className="size-3 transition-transform duration-300 group-hover:-translate-y-0.5"
                      />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
