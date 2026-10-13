import type {
  ComponentPropsWithoutRef,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const controlBase =
  "w-full border border-stone/90 bg-white px-4 py-3 text-[0.95rem] text-charcoal transition-colors duration-200 placeholder:text-charcoal/35 hover:border-stone focus:border-bronze focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-stone/25 disabled:text-charcoal/50";

const controlError = "border-red-500/70 focus:border-red-500";

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** Wraps a control with a label, optional hint and inline error message. */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={id}
        className="flex items-baseline justify-between gap-3 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-charcoal/70"
      >
        <span>
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </span>
        {hint ? (
          <span className="text-[0.68rem] font-normal normal-case tracking-normal text-charcoal/45">
            {hint}
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[0.8rem] text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface InputProps extends ComponentPropsWithoutRef<"input"> {
  invalid?: boolean;
}

export function Input({ className, invalid, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(controlBase, invalid && controlError, className)}
      {...rest}
    />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ className, invalid, children, ...rest }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(controlBase, "appearance-none pr-10", invalid && controlError, className)}
      {...rest}
    >
      {children}
    </select>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ className, invalid, ...rest }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(controlBase, "min-h-32 resize-y", invalid && controlError, className)}
      {...rest}
    />
  );
}
