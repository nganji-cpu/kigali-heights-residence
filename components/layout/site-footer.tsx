import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { Wordmark } from "@/components/layout/wordmark";
import { ConceptNotice } from "@/components/layout/concept-notice";
import { copyrightYear, footerNav, siteConfig } from "@/data/site";

export function SiteFooter() {
  const year = copyrightYear;

  return (
    <footer className="mt-auto bg-ink text-ivory">
      <div className="shell flex flex-col gap-14 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)]">
          <div className="flex flex-col gap-6">
            <Wordmark tone="light" />
            <p className="max-w-sm text-[0.92rem] leading-relaxed text-ivory/65">
              A five-level apartment residence concept for international visitors, business
              travellers and longer stays in Kigali, Rwanda.
            </p>

            <ul className="flex flex-col gap-3 text-[0.85rem] text-ivory/70">
              <li className="flex items-start gap-3">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-bronze-soft" />
                <span>
                  {siteConfig.location.district}
                  <br />
                  {siteConfig.location.city}, {siteConfig.location.country}
                  <span className="block text-[0.75rem] text-ivory/45">
                    {siteConfig.location.addressLine}
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-bronze-soft" />
                <span>
                  {siteConfig.contact.phone}
                  <span className="block text-[0.75rem] text-ivory/45">
                    {siteConfig.contact.phoneNote}
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-bronze-soft" />
                <span>
                  {siteConfig.contact.email}
                  <span className="block text-[0.75rem] text-ivory/45">
                    {siteConfig.contact.emailNote}
                  </span>
                </span>
              </li>
            </ul>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {footerNav.map((column) => (
              <nav key={column.title} aria-label={column.title} className="flex flex-col gap-4">
                <h2 className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-bronze-soft">
                  {column.title}
                </h2>
                <ul className="flex flex-col gap-2.5">
                  {column.items.map((item) => (
                    <li key={`${column.title}-${item.href}`}>
                      <Link
                        href={item.href}
                        className="text-[0.86rem] text-ivory/70 underline-offset-4 transition-colors duration-300 hover:text-ivory hover:underline"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <ConceptNotice tone="dark"className="max-w-4xl" />

        <div className="flex flex-col gap-6 border-t border-ivory/12 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-[0.78rem] text-ivory/50">
            © {year} {siteConfig.name} — {siteConfig.conceptLabel}.
          </p>

          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {siteConfig.social.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex items-center gap-1.5 text-[0.78rem] text-ivory/60 underline-offset-4 transition-colors duration-300 hover:text-ivory hover:underline"
                >
                  {item.label}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
