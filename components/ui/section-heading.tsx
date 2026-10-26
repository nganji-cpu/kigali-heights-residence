import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  as?: ElementType;
  size?: "md" | "lg" | "xl";
  className?: string;
  children?: ReactNode;
}

const sizes = {
  md: "text-2xl sm:text-3xl lg:text-[2.25rem]",
  lg: "text-3xl sm:text-4xl lg:text-[3.1rem]",
  xl: "text-[2.35rem] leading-[1.08] sm:text-5xl lg:text-[3.5rem]",
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
  as: Tag = "h2",
  size = "lg",
  className,
  children,
}: SectionHeadingProps) {
  const isLight = tone === "light";

  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? (
        <span className={cn("eyebrow", isLight && "text-bronze-soft")}>{eyebrow}</span>
      ) : null}

      <Tag
        className={cn(
          "font-display leading-[1.06] tracking-[-0.01em] text-balance-tight",
          sizes[size],
          isLight ? "text-ivory" : "text-charcoal",
        )}
      >
        {title}
      </Tag>

      {description ? (
        <p
          className={cn(
            "max-w-2xl text-[0.98rem] leading-relaxed sm:text-base",
            align === "center" && "mx-auto",
            isLight ? "text-ivory/70" : "text-charcoal/70",
          )}
        >
          {description}
        </p>
      ) : null}

      {children}
    </div>
  );
}
