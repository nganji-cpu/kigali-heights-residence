import Image from "next/image";
import { Check, Plus } from "lucide-react";
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
 * services page client component) the card renders a working selection control.
 */
export function ServiceCard({ service, selected = false, onToggle }: ServiceCardProps) {
  const interactive = typeof onToggle === "function";

  return (
    <article className="group flex h-full flex-col">
      <div className="frame frame-zoom relative aspect-[4/3]">
        <Image
          src={service.image}
          alt={service.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 pt-5">
        <p className="text-[0.7rem] text-charcoal/70">
          {serviceCategoryLabels[service.category]} · {pricingTypeLabels[service.pricingType]}
        </p>
        <h3 className="font-display text-2xl leading-snug">{service.name}</h3>
        <p className="text-[0.9rem] leading-relaxed text-charcoal/65">{service.summary}</p>

        <div className="mt-auto flex flex-col gap-4 border-t border-stone/70 pt-4">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-2xl leading-none">
              {formatUSD(service.samplePrice)}
            </span>
            <span className="text-[0.72rem] text-charcoal/70">
              {pricingTypeLabels[service.pricingType]}
            </span>
          </p>

          {interactive ? (
            <button
              type="button"
              onClick={() => onToggle(service.slug)}
              aria-pressed={selected}
              className={cn(
                "inline-flex items-center justify-between gap-3 border px-4 py-3 text-[0.72rem] font-medium transition-colors duration-300",
                selected
                  ? "border-bronze bg-bronze text-white hover:border-bronze-soft hover:bg-bronze-soft"
                  : "border-charcoal/20 text-charcoal hover:border-charcoal hover:bg-charcoal hover:text-ivory",
              )}
            >
              {selected ? "Added to your stay" : "Add to your stay"}
              <span
                aria-hidden="true"
                className="flex size-5 items-center justify-center rounded-full border border-current"
              >
                {selected ? <Check className="size-3" /> : <Plus className="size-3" />}
              </span>
            </button>
          ) : (
            <p className="text-[0.72rem] text-charcoal/70">Available during reservation</p>
          )}
        </div>
      </div>
    </article>
  );
}
