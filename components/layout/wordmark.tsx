import Link from "next/link";
import { siteConfig } from "@/data/site";
import { cn } from "@/lib/utils";

interface WordmarkProps {
  tone?: "dark" | "light";
  className?: string;
  /** Hide the monogram on very small screens. */
  compact?: boolean;
}

/** Text-based brand mark. Change `siteConfig.name` to rebrand the prototype. */
export function Wordmark({ tone = "dark", className, compact = false }: WordmarkProps) {
  const isLight = tone === "light";

  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} — home`}
      className={cn("group flex items-center gap-3", className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center border font-display text-[1.05rem] leading-none tracking-[0.02em] transition-colors duration-300",
          isLight
            ? "border-ivory/35 text-ivory group-hover:border-bronze"
            : "border-charcoal/25 text-charcoal group-hover:border-bronze group-hover:text-bronze",
          compact && "hidden sm:flex",
        )}
      >
        KH
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.2rem] tracking-[0.01em] sm:text-[1.32rem]",
            isLight ? "text-ivory" : "text-charcoal",
          )}
        >
          Kigali Heights
        </span>
        <span
          className={cn(
            "mt-1 text-[0.55rem] uppercase tracking-[0.34em]",
            isLight ? "text-ivory/60" : "text-charcoal/50",
          )}
        >
          Residence
        </span>
      </span>
    </Link>
  );
}
