"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { StatusMessage } from "@/components/ui/status-message";
import { postJson } from "@/lib/api-client";
import type { AuthUser } from "@/types";

interface AdminLoginFormProps {
  nextPath: string;
}

/**
 * Only relative admin destinations are accepted. Anything else falls back to
 * the operations dashboard, so a crafted `next` value cannot redirect a member
 * of staff to another site.
 */
function safeAdminDestination(nextPath: string): string {
  if (
    nextPath.startsWith("/admin/") &&
    !nextPath.startsWith("//") &&
    !nextPath.startsWith("/admin/login")
  ) {
    return nextPath;
  }
  return "/admin";
}

export function AdminLoginForm({ nextPath }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMessage(null);
    setErrors({});

    const result = await postJson<{ user: AuthUser }>("/api/admin/auth/login", {
      email: email.trim(),
      password,
    });

    if (!result.ok) {
      setMessage(result.message);
      if (result.fields) setErrors(result.fields);
      setSubmitting(false);
      return;
    }

    router.push(safeAdminDestination(nextPath));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="flex items-start gap-3 border border-bronze/30 bg-bronze/8 px-4 py-3 text-[0.82rem] leading-relaxed text-charcoal/75">
        <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-bronze" />
        <p>
          This portal is for authorized administrators and residence staff. Customer accounts
          should use the{" "}
          <Link
            href="/login"
            className="text-charcoal underline-offset-4 hover:text-bronze hover:underline"
          >
            guest sign-in
          </Link>
          .
        </p>
      </div>

      {message ? (
        <StatusMessage tone="error" title="Could not sign in">
          {message}
        </StatusMessage>
      ) : null}

      <div className="flex flex-col gap-5">
        <Field id="admin-login-email" label="Work email" required error={errors.email}>
          <Input
            id="admin-login-email"
            type="email"
            value={email}
            autoComplete="username"
            placeholder="name@kigaliheights.com"
            invalid={Boolean(errors.email)}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field id="admin-login-password" label="Password" required error={errors.password}>
          <div className="relative">
            <Input
              id="admin-login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              autoComplete="current-password"
              className="pr-12"
              invalid={Boolean(errors.password)}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-charcoal/60 transition-colors hover:text-charcoal"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[0.8rem]">
        <Link
          href="/forgot-password?portal=admin"
          className="text-charcoal/70 underline-offset-4 hover:text-bronze hover:underline"
        >
          Forgot your password?
        </Link>
        <span className="text-charcoal/45">Sessions expire after 7 days.</span>
      </div>

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {submitting ? "Verifying access" : "Sign in to portal"}
      </Button>
    </form>
  );
}
