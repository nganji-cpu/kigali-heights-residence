import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotFoundStateProps {
  eyebrow?: string;
  title: string;
  description: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  className?: string;
}

/** Shared empty / not-found panel used by 404s and empty filter results. */
export function NotFoundState({
  eyebrow = "Nothing here yet",
  title,
  description,
  primary = { href: "/rooms", label: "Browse accommodation" },
  secondary = { href: "/", label: "Back to home" },
  className,
}: NotFoundStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-6 border border-stone/80 bg-white px-6 py-16 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full border border-bronze/40 text-bronze">
        <Compass aria-hidden="true" className="size-5" />
      </span>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="max-w-md font-display text-3xl leading-tight sm:text-4xl">{title}</h2>
      <p className="max-w-lg text-[0.95rem] leading-relaxed text-charcoal/65">{description}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <ButtonLink href={primary.href}>{primary.label}</ButtonLink>
        <ButtonLink href={secondary.href} variant="secondary">
          {secondary.label}
        </ButtonLink>
      </div>
    </div>
  );
}
