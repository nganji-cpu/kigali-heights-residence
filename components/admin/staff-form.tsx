"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { StatusMessage } from "@/components/ui/status-message";
import { postJson } from "@/lib/api-client";
import type { AuthUser } from "@/types";

/** Creates a staff account. Admin-only; the server fixes the role to `staff`. */
export function StaffForm() {
  const router = useRouter();
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
    setSuccess(false);

    const result = await postJson<{ user: AuthUser }>("/api/admin/staff", {
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

    setSuccess(true);
    setMessage(`${result.data.user.fullName} can now sign in to the operations portal.`);
    setValues({ fullName: "", email: "", phone: "", password: "" });
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {message ? (
        <StatusMessage tone={success ? "success" : "error"} title={message}>
          {null}
        </StatusMessage>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="staff-name"
          label="Full name"
          required
          error={errors.fullName}
          className="sm:col-span-2"
        >
          <Input
            id="staff-name"
            value={values.fullName}
            invalid={Boolean(errors.fullName)}
            onChange={(event) => update("fullName", event.target.value)}
          />
        </Field>
        <Field id="staff-email" label="Email" required error={errors.email}>
          <Input
            id="staff-email"
            type="email"
            value={values.email}
            invalid={Boolean(errors.email)}
            onChange={(event) => update("email", event.target.value)}
          />
        </Field>
        <Field id="staff-phone" label="Phone" required error={errors.phone}>
          <Input
            id="staff-phone"
            type="tel"
            value={values.phone}
            invalid={Boolean(errors.phone)}
            onChange={(event) => update("phone", event.target.value)}
          />
        </Field>
        <Field
          id="staff-password"
          label="Temporary password"
          hint="8+ characters, letters and numbers"
          required
          error={errors.password}
          className="sm:col-span-2"
        >
          <Input
            id="staff-password"
            type="password"
            value={values.password}
            autoComplete="new-password"
            invalid={Boolean(errors.password)}
            onChange={(event) => update("password", event.target.value)}
          />
        </Field>
      </div>

      <Button type="submit" loading={submitting}>
        {submitting ? "Creating" : "Create staff account"}
      </Button>
    </form>
  );
}
