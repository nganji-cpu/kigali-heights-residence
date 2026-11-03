import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  image: { src: string; alt: string };
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Shared split layout for sign-in and registration. Mirrors the editorial
 * language used elsewhere on the site without touching the public pages.
 */
export function AuthLayout({
  eyebrow,
  title,
  description,
  image,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <section className="shell grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16 lg:py-20">
      <div className="flex w-full max-w-lg flex-col gap-8">
        <div className="flex flex-col gap-5">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="font-display text-[2.3rem] leading-[1.06] tracking-[-0.015em] text-balance-tight sm:text-5xl">
            {title}
          </h1>
          <p className="text-[0.98rem] leading-relaxed text-charcoal/70">{description}</p>
        </div>

        {children}

        <div className="border-t border-stone/70 pt-6 text-[0.88rem] text-charcoal/70">
          {footer}
        </div>
      </div>

      <div className="frame relative hidden aspect-[4/5] w-full lg:block">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          loading="eager"
          fetchPriority="high"
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-8 pt-24">
          <p className="font-display text-2xl leading-snug text-ivory">
            Six apartments above Kigali, with proper kitchens and quiet workspaces.
          </p>
          <Link
            href="/rooms"
            className="mt-4 inline-flex text-[0.78rem] text-ivory/80 underline-offset-4 transition-colors hover:text-ivory hover:underline"
          >
            Browse the apartments
          </Link>
        </div>
      </div>
    </section>
  );
}
