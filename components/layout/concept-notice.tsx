import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface ConceptNoticeProps {
  tone?: "dark" | "light";
  className?: string;
}

const shortText =
  "Concept prototype a fictional design study, not a real operating property.";



/**
 * Discreet but readable concept-project disclosure. Appears in the footer and
 * on any page that could otherwise be mistaken for a live commercial site.
 */
export function ConceptNotice({ tone = "dark", className}: ConceptNoticeProps) {
  const isLight = tone === "light";

  return (
    <div
      className={cn(
        "flex items-start gap-3 border px-4 py-3.5 text-[0.8rem] leading-relaxed",
        isLight
          ? "border-bronze/35 bg-bronze/8 text-charcoal/80"
          : "border-ivory/15 bg-ivory/5 text-ivory/70",
        className,
      )}
    >
      <Info
        aria-hidden="true"
        className={cn("mt-0.5 size-4 shrink-0", isLight ? "text-bronze" : "text-bronze-soft")}
      />
      <p>
        <span className={cn("font-medium", isLight ? "text-charcoal" : "text-ivory/90")}>
          Concept project.
        </span>{" "}
        {shortText}
      </p>
    </div>
  );
}
