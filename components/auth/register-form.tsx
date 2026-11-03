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

/** Registration always creates a customer account; the server ignores any role. */
export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMessage(null);
    setErrors({});

    const result = await postJson<{ user: AuthUser }>("/api/auth/register", {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      password: values.password,
    });

    if (!result.ok) {
      setMessage(result.message);
      if (result.fields) setErrors(result.fields);
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {message ? (
        <StatusMessage tone="error" title="Could not create your account">
          {message}
        </StatusMessage>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="register-name"
          label="Full name"
          required
          error={errors.fullName}
          className="sm:col-span-2"
        >
          <Input
            id="register-name"
            value={values.fullName}
            autoComplete="name"
            placeholder="Amina Uwase"
            invalid={Boolean(errors.fullName)}
            onChange={(event) => update("fullName", event.target.value)}
          />
        </Field>

        <Field id="register-email" label="Email" required error={errors.email}>
          <Input
            id="register-email"
            type="email"
            value={values.email}
            autoComplete="email"
            placeholder="you@example.com"
            invalid={Boolean(errors.email)}
            onChange={(event) => update("email", event.target.value)}
          />
        </Field>

        <Field id="register-phone" label="Phone" required error={errors.phone}>
          <Input
            id="register-phone"
            type="tel"
            value={values.phone}
            autoComplete="tel"
            placeholder="+250 788 000 000"
            invalid={Boolean(errors.phone)}
            onChange={(event) => update("phone", event.target.value)}
          />
        </Field>

        <Field
          id="register-password"
          label="Password"
          hint="8+ characters, letters and numbers"
          required
          error={errors.password}
          className="sm:col-span-2"
        >
          <div className="relative">
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={values.password}
              autoComplete="new-password"
              className="pr-12"
              invalid={Boolean(errors.password)}
              onChange={(event) => update("password", event.target.value)}
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

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {submitting ? "Creating account" : "Create account"}
      </Button>

      <p className="text-[0.82rem] leading-relaxed text-charcoal/70">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-charcoal underline-offset-4 hover:text-bronze hover:underline"
        >
          Sign in
        </Link>
        . By creating an account you agree to receive reservation updates by email.
      </p>
    </form>
  );
}
