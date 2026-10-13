"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "@/components/layout/wordmark";
import { primaryNav, siteConfig } from "@/data/site";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string): boolean {
  const base = href.split("?")[0];
  if (base === "/") return pathname === "/";
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Escape to close + lock background scrolling while open.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-stone/70 bg-ivory/95 backdrop-blur-sm">
      <div className="shell flex h-17 items-center justify-between gap-6 lg:h-19">
        <Wordmark compact />

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {primaryNav.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative py-2 text-[0.72rem] font-medium uppercase tracking-[0.19em] transition-colors duration-300",
                      active ? "text-bronze" : "text-charcoal/75 hover:text-charcoal",
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-bronze transition-transform duration-500",
                        active && "scale-x-100",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/book" size="sm" className="hidden sm:inline-flex">
            Reserve your stay
          </ButtonLink>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex size-11 items-center justify-center border border-charcoal/20 text-charcoal transition-colors duration-300 hover:border-bronze hover:text-bronze lg:hidden"
          >
            {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation panel */}
      <div
        id="mobile-navigation"
        hidden={!open}
        className={cn(
          "fixed inset-0 z-40 overflow-y-auto bg-ivory pt-26 pb-14 transition-opacity duration-500 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <nav aria-label="Mobile" className="shell">
          <ul className="flex flex-col divide-y divide-stone/70 border-y border-stone/70">
            {primaryNav.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    tabIndex={open ? undefined : -1}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className="flex flex-col gap-1.5 py-5"
                  >
                    <span
                      className={cn(
                        "font-display text-3xl leading-none",
                        active ? "text-bronze" : "text-charcoal",
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="text-[0.8rem] leading-relaxed text-charcoal/55">
                      {item.description}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-col gap-5">
            <ButtonLink
              href="/book"
              size="lg"
              tabIndex={open ? undefined : -1}
              onClick={() => setOpen(false)}
              className="w-full"
            >
              Reserve your stay
            </ButtonLink>

            <div className="flex flex-col gap-2 text-[0.82rem] text-charcoal/65">
              <a
                href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
                tabIndex={open ? undefined : -1}
                className="inline-flex items-center gap-2 hover:text-bronze"
              >
                <Phone aria-hidden="true" className="size-3.5 text-bronze" />
                {siteConfig.contact.phone}
                <span className="text-charcoal/40">({siteConfig.contact.phoneNote})</span>
              </a>
              <p className="text-charcoal/45">
                {siteConfig.location.district}, {siteConfig.location.city}
              </p>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
