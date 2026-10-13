import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "light"
  | "bronze";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 border text-[0.78rem] font-medium uppercase tracking-[0.16em] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-charcoal bg-charcoal text-ivory hover:border-ink hover:bg-ink active:translate-y-px",
  secondary:
    "border-charcoal/25 bg-transparent text-charcoal hover:border-charcoal hover:bg-charcoal hover:text-ivory",
  outline:
    "border-stone bg-transparent text-charcoal hover:border-bronze hover:text-bronze",
  ghost: "border-transparent bg-transparent text-charcoal hover:text-bronze",
  light:
    "border-ivory/40 bg-transparent text-ivory hover:border-ivory hover:bg-ivory hover:text-charcoal",
  bronze:
    "border-bronze bg-bronze text-white hover:border-bronze-soft hover:bg-bronze-soft",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2.5 text-[0.68rem]",
  md: "px-6 py-3.5",
  lg: "px-8 py-4 text-[0.8rem]",
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: Omit<CommonProps, "children"> = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, "className" | "children"> & {
    loading?: boolean;
  };

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  loading = false,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Loader2 aria-hidden="true" className="size-4 shrink-0 spinner" />
      ) : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = CommonProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, "className" | "children">;

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...rest}>
      {children}
    </Link>
  );
}
