import Link from "next/link";
import { Wordmark } from "@/components/layout/wordmark";
import { ConceptNotice } from "@/components/layout/concept-notice";
import { copyrightYear, footerNav, siteConfig } from "@/data/site";

export function SiteFooter() {
  const year = copyrightYear;

  return (
    <footer className="mt-auto bg-ink text-ivory">
      <div className="shell flex flex-col gap-14 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-20">
          <div className="flex flex-col gap-6">
            <Wordmark tone="light" />
            <p className="max-w-sm text-[0.95rem] leading-relaxed text-ivory/65">
              Six apartments, a shared rooftop and a quiet corner of Kigali.
            </p>
            <p className="text-[0.78rem] text-ivory/65">
              {siteConfig.location.city}, {siteConfig.location.country}
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2">
            {footerNav.map((column) => (
              <nav key={column.title} aria-label={column.title} className="flex flex-col gap-4">
                <h2 className="text-[0.78rem] font-medium text-bronze-soft">{column.title}</h2>
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

        <ConceptNotice tone="dark" className="max-w-4xl" />

        <div className="flex flex-col gap-4 border-t border-ivory/12 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.78rem] text-ivory/65">
            © {year} {siteConfig.name}. A design concept.
          </p>

          <Link
            href="/credits"
            className="text-[0.78rem] text-ivory/65 underline-offset-4 transition-colors duration-300 hover:text-ivory hover:underline"
          >
            Image credits
          </Link>
        </div>
      </div>
    </footer>
  );
}
