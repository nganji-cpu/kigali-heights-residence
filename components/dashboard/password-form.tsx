"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { StatusMessage } from "@/components/ui/status-message";
import { postJson } from "@/lib/api-client";

export function PasswordForm() {
  const router = useRouter();
  const [values, setValues] = useState({ currentPassword: "", newPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMessage(null);
    setSuccess(false);
    setErrors({});

    const result = await postJson<{ ok: boolean }>("/api/account/password", {
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });

    if (!result.ok) {
      setMessage(result.message);
      if (result.fields) setErrors(result.fields);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setMessage("Password changed. Other signed-in devices have been signed out.");
    setValues({ currentPassword: "", newPassword: "" });
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {message ? (
        <StatusMessage tone={success ? "success" : "error"} title={message} />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="password-current"
          label="Current password"
          required
          error={errors.currentPassword}
          className="sm:col-span-2"
        >
          <Input
            id="password-current"
            type="password"
            autoComplete="current-password"
            value={values.currentPassword}
            invalid={Boolean(errors.currentPassword)}
            onChange={(event) =>
              setValues((current) => ({ ...current, currentPassword: event.target.value }))
            }
          />
        </Field>
        <Field
          id="password-new"
          label="New password"
          hint="8+ characters, letters and numbers"
          required
          error={errors.newPassword}
          className="sm:col-span-2"
        >
          <Input
            id="password-new"
            type="password"
            autoComplete="new-password"
            value={values.newPassword}
            invalid={Boolean(errors.newPassword)}
            onChange={(event) =>
              setValues((current) => ({ ...current, newPassword: event.target.value }))
            }
          />
        </Field>
      </div>

      <Button type="submit" loading={submitting}>
        {submitting ? "Updating" : "Change password"}
      </Button>
    </form>
  );
}
