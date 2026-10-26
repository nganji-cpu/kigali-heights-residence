import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  /** Optional supporting image for the editorial split layout. */
  image?: { src: string; alt: string };
  meta?: { label: string; value: string }[];
  children?: ReactNode;
  className?: string;
}

/**
 * Editorial page heading used by every inner page so the hierarchy stays
 * consistent: eyebrow, display headline, supporting copy, optional meta.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  image,
  meta,
  children,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "border-b border-stone/70 bg-canvas",
        className,
      )}
    >
      <div className="shell grid gap-12 py-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end lg:gap-16 lg:py-20">
        <div className="flex flex-col gap-6">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="max-w-3xl font-display text-[2.35rem] leading-[1.06] tracking-[-0.015em] text-balance-tight sm:text-5xl lg:text-[3.8rem]">
            {title}
          </h1>
          <p className="max-w-2xl text-[1rem] leading-relaxed text-charcoal/70 sm:text-[1.05rem]">
            {description}
          </p>
          {children ? <div className="flex flex-wrap items-center gap-3 pt-1">{children}</div> : null}
        </div>

        {image ? (
          <div className="frame relative aspect-[4/3] w-full lg:aspect-[5/4]">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>

      {meta && meta.length > 0 ? (
        <div className="border-t border-stone/70">
          <dl className="shell grid grid-cols-2 gap-x-8 gap-y-6 py-8 sm:grid-cols-3 lg:grid-cols-6">
            {meta.map((item) => (
              <div key={item.label} className="flex flex-col gap-1.5">
                <dt className="text-[0.72rem] text-charcoal/70">
                  {item.label}
                </dt>
                <dd className="font-display text-lg leading-tight text-charcoal">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  );
}
