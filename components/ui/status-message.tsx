import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusTone = "success" | "error" | "info";

const tones: Record<StatusTone, { wrapper: string; icon: ReactNode }> = {
  success: {
    wrapper: "border-sage/40 bg-sage/10 text-charcoal",
    icon: <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-sage" />,
  },
  error: {
    wrapper: "border-red-600/30 bg-red-50 text-red-900",
    icon: <AlertCircle aria-hidden="true" className="size-5 shrink-0 text-red-700" />,
  },
  info: {
    wrapper: "border-bronze/35 bg-bronze/8 text-charcoal",
    icon: <Info aria-hidden="true" className="size-5 shrink-0 text-bronze" />,
  },
};

interface StatusMessageProps {
  tone?: StatusTone;
  title: string;
  children?: ReactNode;
  className?: string;
  /** Announce changes to assistive technology as they appear. */
  live?: boolean;
}

export function StatusMessage({
  tone = "info",
  title,
  children,
  className,
  live = true,
}: StatusMessageProps) {
  const styles = tones[tone];

  return (
    <div
      role={tone === "error" ? "alert" : live ? "status" : undefined}
      aria-live={live && tone !== "error" ? "polite" : undefined}
      className={cn(
        "flex items-start gap-3 border px-4 py-3.5 text-[0.9rem] leading-relaxed",
        styles.wrapper,
        className,
      )}
    >
      {styles.icon}
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        {children ? <div className="text-charcoal/75">{children}</div> : null}
      </div>
    </div>
  );
}
