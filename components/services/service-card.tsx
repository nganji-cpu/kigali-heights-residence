import Image from "next/image";
import { Check, Plus } from "lucide-react";
import { ServiceIcon } from "@/components/services/service-icon";
import { pricingTypeLabels, serviceCategoryLabels } from "@/data/services";
import { cn, formatUSD } from "@/lib/utils";
import type { Service } from "@/types";

interface ServiceCardProps {
  service: Service;
  selected?: boolean;
  onToggle?: (slug: string) => void;
}

/**
 * Presentational service card. When an `onToggle` handler is provided (by the
 * services page client component) the card renders a working
 * "Add to My Stay" control.
 */
export function ServiceCard({ service, selected = false, onToggle }: ServiceCardProps) {
  const interactive = typeof onToggle === "function";

  return (
    <article
      className={cn(
        "group flex h-full flex-col border bg-white transition-all duration-500",
        selected ? "border-bronze shadow-[var(--shadow-card)]" : "border-stone/80",
      )}
    >
      <div className="frame relative aspect-[16/10]">
        <Image
          src={service.image}
          alt={service.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
        <span className="absolute right-0 top-0 bg-charcoal/85 px-3 py-2 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-ivory backdrop-blur-sm">
          {serviceCategoryLabels[service.category]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center border border-bronze/30 text-bronze">
            <ServiceIcon name={service.icon} className="size-4" />
          </span>
          <div className="flex flex-col gap-1.5">
            <h3 className="font-display text-2xl leading-snug">{service.name}</h3>
            <p className="text-[0.9rem] leading-relaxed text-charcoal/65">{service.summary}</p>
          </div>
        </div>

        <p className="text-[0.86rem] leading-relaxed text-charcoal/60">{service.description}</p>

        <div className="mt-auto flex flex-col gap-4 border-t border-stone/70 pt-5">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-2xl leading-none">from {formatUSD(service.samplePrice)}</span>
            <span className="text-[0.72rem] uppercase tracking-[0.16em] text-charcoal/50">
              {pricingTypeLabels[service.pricingType]}
            </span>
          </p>
          <p className="text-[0.72rem] text-charcoal/45">{service.priceNote}</p>

          {interactive ? (
            <button
              type="button"
              onClick={() => onToggle(service.slug)}
              aria-pressed={selected}
              className={cn(
                "inline-flex items-center justify-between gap-3 border px-4 py-3 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300",
                selected
                  ? "border-bronze bg-bronze text-white hover:border-bronze-soft hover:bg-bronze-soft"
                  : "border-charcoal/20 text-charcoal hover:border-charcoal hover:bg-charcoal hover:text-ivory",
              )}
            >
              {selected ? "Added to my stay" : "Add to my stay"}
              <span
                aria-hidden="true"
                className="flex size-5 items-center justify-center rounded-full border border-current"
              >
                {selected ? <Check className="size-3" /> : <Plus className="size-3" />}
              </span>
            </button>
          ) : (
            <p className="text-[0.72rem] uppercase tracking-[0.16em] text-charcoal/50">
              Available to add during reservation
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
