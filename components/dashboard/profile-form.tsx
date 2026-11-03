"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { StatusMessage } from "@/components/ui/status-message";
import { postJson } from "@/lib/api-client";
import type { AuthUser } from "@/types";

export function ProfileForm({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [values, setValues] = useState({
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMessage(null);
    setErrors({});

    const result = await postJson<{ user: AuthUser }>("/api/account/profile", {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
    });

    if (!result.ok) {
      setMessage(result.message);
      if (result.fields) setErrors(result.fields);
      setSubmitting(false);
      return;
    }

    setValues({
      fullName: result.data.user.fullName,
      email: result.data.user.email,
      phone: result.data.user.phone,
    });
    setMessage("Profile updated.");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {message ? (
        <StatusMessage tone={message.includes("updated") ? "success" : "error"} title={message} />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="profile-name"
          label="Full name"
          required
          error={errors.fullName}
          className="sm:col-span-2"
        >
          <Input
            id="profile-name"
            value={values.fullName}
            invalid={Boolean(errors.fullName)}
            onChange={(event) => setValues((current) => ({ ...current, fullName: event.target.value }))}
          />
        </Field>
        <Field id="profile-email" label="Email" required error={errors.email}>
          <Input
            id="profile-email"
            type="email"
            value={values.email}
            invalid={Boolean(errors.email)}
            onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
          />
        </Field>
        <Field id="profile-phone" label="Phone" required error={errors.phone}>
          <Input
            id="profile-phone"
            type="tel"
            value={values.phone}
            invalid={Boolean(errors.phone)}
            onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))}
          />
        </Field>
      </div>

      <Button type="submit" loading={submitting}>
        {submitting ? "Saving" : "Save changes"}
      </Button>
    </form>
  );
}
