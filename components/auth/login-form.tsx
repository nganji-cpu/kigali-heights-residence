"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { StatusMessage } from "@/components/ui/status-message";
import { postJson } from "@/lib/api-client";
import type { AuthUser } from "@/types";

interface LoginFormProps {
  nextPath: string;
}

/** Only allow relative, same-site destinations supplied by the login redirect. */
function safeDestination(user: AuthUser, nextPath: string): string {
  if (nextPath.startsWith("/") && !nextPath.startsWith("//")) return nextPath;
  return user.role === "customer" ? "/dashboard" : "/admin";
}

export function LoginForm({ nextPath }: LoginFormProps) {
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

    const result = await postJson<{ user: AuthUser }>("/api/auth/login", {
      email: email.trim(),
      password,
    });

    if (!result.ok) {
      setMessage(result.message);
      if (result.fields) setErrors(result.fields);
      setSubmitting(false);
      return;
    }

    router.push(safeDestination(result.data.user, nextPath));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {message ? (
        <StatusMessage tone="error" title="Could not sign in">
          {message}
        </StatusMessage>
      ) : null}

      <div className="flex flex-col gap-5">
        <Field id="login-email" label="Email" required error={errors.email}>
          <Input
            id="login-email"
            type="email"
            value={email}
            autoComplete="email"
            placeholder="you@example.com"
            invalid={Boolean(errors.email)}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field id="login-password" label="Password" required error={errors.password}>
          <div className="relative">
            <Input
              id="login-password"
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

      <div className="-mt-2 text-[0.8rem]">
        <Link
          href="/forgot-password"
          className="text-charcoal/70 underline-offset-4 hover:text-bronze hover:underline"
        >
          Forgot your password?
        </Link>
      </div>

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {submitting ? "Signing in" : "Sign in"}
      </Button>

      <p className="text-[0.82rem] leading-relaxed text-charcoal/70">
        Sign in to hold your reservation, resume a saved draft or manage your stay.{" "}
        <Link
          href="/register"
          className="text-charcoal underline-offset-4 hover:text-bronze hover:underline"
        >
          Need an account?
        </Link>
      </p>
    </form>
  );
}
