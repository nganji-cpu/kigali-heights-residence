"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { StatusMessage } from "@/components/ui/status-message";
import { postJson } from "@/lib/api-client";

interface ForgotPasswordFormProps {
  portal: "customer" | "admin";
}

interface ForgotPasswordResponse {
  ok: boolean;
  message: string;
  emailConfigured: boolean;
  expiresInMinutes: number;
}

/**
 * Requests a reset link. The server answers identically whether or not the
 * address has an account, so this form never reveals which emails exist.
 */
export function ForgotPasswordForm({ portal }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ForgotPasswordResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const signInHref = portal === "admin" ? "/admin/login" : "/login";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMessage(null);
    setErrors({});

    const response = await postJson<ForgotPasswordResponse>("/api/auth/forgot-password", {
      email: email.trim(),
      portal,
    });

    if (!response.ok) {
      setMessage(response.message);
      if (response.fields) setErrors(response.fields);
      setSubmitting(false);
      return;
    }

    setResult(response.data);
    setSubmitting(false);
  }

  if (result) {
    return (
      <div className="flex flex-col gap-6">
        <StatusMessage tone="success" title="Check your inbox">
          {result.message} The link works for {result.expiresInMinutes} minutes and can be used
          once.
        </StatusMessage>
        {!result.emailConfigured ? (
          <StatusMessage tone="info" title="Email is not set up on this server">
            No message can be sent until SMTP is configured. Ask the site administrator to
            complete the email settings.
          </StatusMessage>
        ) : null}
        <Link
          href={signInHref}
          className="text-[0.88rem] text-charcoal underline-offset-4 hover:text-bronze hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {message ? (
        <StatusMessage tone="error" title="Could not send the link">
          {message}
        </StatusMessage>
      ) : null}

      <Field id="forgot-email" label="Email" required error={errors.email}>
        <Input
          id="forgot-email"
          type="email"
          value={email}
          autoComplete="email"
          placeholder="you@example.com"
          invalid={Boolean(errors.email)}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {submitting ? "Sending link" : "Send reset link"}
      </Button>

      <Link
        href={signInHref}
        className="text-[0.88rem] text-charcoal/70 underline-offset-4 hover:text-bronze hover:underline"
      >
        Back to sign in
      </Link>
    </form>
  );
}
