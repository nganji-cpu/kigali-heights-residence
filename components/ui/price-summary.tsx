import { formatUSD } from "@/lib/utils";
import type { PriceBreakdown } from "@/types";
import { cn } from "@/lib/utils";

interface PriceSummaryProps {
  breakdown: PriceBreakdown;
  title?: string;
  className?: string;
  /** Extra content rendered under the totals (e.g. a disclaimer). */
  footer?: React.ReactNode;
  emptyMessage?: string;
}

/**
 * Itemised price breakdown used on apartment and booking pages. Totals are
 * recalculated from the dates shown and are always presented as estimates.
 */
export function PriceSummary({
  breakdown,
  title = "Estimated total",
  className,
  footer,
  emptyMessage = "Choose an apartment and dates to see a total.",
}: PriceSummaryProps) {
  const hasContent = breakdown.lines.length > 0;

  return (
    <div className={cn("border border-stone/80 bg-white", className)}>
      <div className="border-b border-stone/70 px-5 py-4">
        <h3 className="font-display text-2xl">{title}</h3>
      </div>

      {hasContent ? (
        <dl className="flex flex-col divide-y divide-stone/60">
          {breakdown.lines.map((line, index) => (
            <div
              key={`${line.label}-${index}`}
              className="flex items-start justify-between gap-6 px-5 py-3.5"
            >
              <dt className="flex flex-col">
                <span className="text-[0.92rem] text-charcoal">{line.label}</span>
                {line.detail ? (
                  <span className="text-[0.78rem] text-charcoal/70">{line.detail}</span>
                ) : null}
              </dt>
              <dd className="shrink-0 text-[0.92rem] tabular-nums text-charcoal">
                {formatUSD(line.amount)}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="px-5 py-6 text-[0.9rem] text-charcoal/70">{emptyMessage}</p>
      )}

      <div className="flex flex-col gap-2 border-t border-stone/70 bg-ivory/70 px-5 py-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[0.72rem] tracking-[0.01em] text-charcoal/70">
            {breakdown.nights > 0
              ? `${breakdown.nights} ${breakdown.nights === 1 ? "night" : "nights"}`
              : "No dates selected"}
          </span>
          <span className="font-display text-3xl tabular-nums text-charcoal">
            {formatUSD(breakdown.total)}
          </span>
        </div>
        {footer ? <div className="pt-1 text-[0.78rem] leading-relaxed text-charcoal/70">{footer}</div> : null}
      </div>
    </div>
  );
}
