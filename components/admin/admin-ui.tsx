import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 border-b border-stone/70 pb-6">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-[0.9rem] leading-relaxed text-charcoal/65">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-3">{action}</div> : null}
    </header>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2 border border-stone/80 bg-white p-5">
      <span className="text-[0.66rem] uppercase tracking-[0.12em] text-charcoal/55">{label}</span>
      <span className="font-display text-3xl leading-none">{value}</span>
      {hint ? <span className="text-[0.72rem] text-charcoal/60">{hint}</span> : null}
    </div>
  );
}

const statusTones: Record<string, string> = {
  pending: "border-amber-700/25 bg-amber-50 text-amber-900",
  confirmed: "border-sage/40 bg-sage/10 text-sage",
  cancelled: "border-red-700/25 bg-red-50 text-red-800",
  available: "border-sage/40 bg-sage/10 text-sage",
  occupied: "border-bronze/30 bg-bronze/10 text-bronze",
  maintenance: "border-amber-700/25 bg-amber-50 text-amber-900",
  inactive: "border-charcoal/20 bg-stone/30 text-charcoal/60",
  active: "border-sage/40 bg-sage/10 text-sage",
  suspended: "border-red-700/25 bg-red-50 text-red-800",
  completed: "border-sage/40 bg-sage/10 text-sage",
  failed: "border-red-700/25 bg-red-50 text-red-800",
  refunded: "border-bronze/30 bg-bronze/10 text-bronze",
  admin: "border-charcoal/30 bg-charcoal/8 text-charcoal",
  staff: "border-bronze/30 bg-bronze/10 text-bronze",
  customer: "border-stone bg-stone/20 text-charcoal/70",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-1 text-[0.66rem] uppercase tracking-[0.1em]",
        statusTones[status] ?? "border-stone bg-stone/20 text-charcoal/70",
      )}
    >
      {status}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="border border-stone/80 bg-white p-8 text-[0.9rem] text-charcoal/65">
      {children}
    </div>
  );
}
