"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { StatusMessage } from "@/components/ui/status-message";
import { postJson } from "@/lib/api-client";

interface ResetPasswordFormProps {
  token: string;
  portal: "customer" | "admin";
}

/** Sets a new password from an emailed single-use token. */
export function ResetPasswordForm({ token, portal }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const signInHref = portal === "admin" ? "/admin/login" : "/login";
  const requestHref = portal === "admin" ? "/forgot-password?portal=admin" : "/forgot-password";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setMessage(null);
    if (password !== confirm) {
      setErrors({ confirm: "The two passwords do not match." });
      return;
    }

    setSubmitting(true);
    setErrors({});

    const response = await postJson<{ ok: boolean; message: string }>(
      "/api/auth/reset-password",
      { token, password },
    );

    if (!response.ok) {
      setMessage(response.message);
      if (response.fields) setErrors(response.fields);
      setSubmitting(false);
      return;
    }

    setDone(response.data.message);
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6">
        <StatusMessage tone="success" title="Password updated">
          {done}
        </StatusMessage>
        <ButtonLink href={signInHref} size="lg" className="w-full">
          Go to sign in
        </ButtonLink>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {message ? (
        <StatusMessage tone="error" title="Could not reset your password">
          {message}{" "}
          <Link
            href={requestHref}
            className="underline underline-offset-4 hover:text-bronze"
          >
            Request a new link
          </Link>
        </StatusMessage>
      ) : null}

      <div className="flex flex-col gap-5">
        <Field
          id="reset-password"
          label="New password"
          required
          error={errors.password ?? errors.token}
          hint="At least 10 characters, with a letter and a number."
        >
          <div className="relative">
            <Input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              value={password}
              autoComplete="new-password"
              className="pr-12"
              invalid={Boolean(errors.password ?? errors.token)}
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

        <Field id="reset-confirm" label="Confirm new password" required error={errors.confirm}>
          <Input
            id="reset-confirm"
            type={showPassword ? "text" : "password"}
            value={confirm}
            autoComplete="new-password"
            invalid={Boolean(errors.confirm)}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </Field>
      </div>

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {submitting ? "Saving" : "Set new password"}
      </Button>
    </form>
  );
}
