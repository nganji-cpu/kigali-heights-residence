import { cn } from "@/lib/utils";
import { siteConfig } from "@/data/site";

interface ConceptNoticeProps {
  tone?: "dark" | "light";
  className?: string;
  /** Show the full concept/booking disclaimer instead of the one-line notice. */
  detailed?: boolean;
}

const shortText =
  "Kigali Heights Residence is a design concept, not an operating property. The property, amenities, rates and availability are illustrative; no payment is taken.";

/**
 * Discreet project disclosure. Appears in the footer and on any page that
 * could otherwise be mistaken for a live commercial site.
 */
export function ConceptNotice({ tone = "dark", className, detailed = false }: ConceptNoticeProps) {
  const isLight = tone === "light";

  return (
    <div
      className={cn(
        "border-l-2 border-bronze/45 pl-3 text-[0.78rem] leading-relaxed",
        isLight ? "text-charcoal/70" : "text-ivory/55",
        className,
      )}
    >
      <p>{detailed ? siteConfig.conceptNotice : shortText}</p>
    </div>
  );
}
