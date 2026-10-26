"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { StatusMessage } from "@/components/ui/status-message";
import { postJson } from "@/lib/api-client";
import { hasErrors } from "@/lib/booking";

type ContactErrors = Partial<Record<"name" | "email" | "subject" | "message", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

const subjects = [
  { value: "general", label: "General enquiry" },
  { value: "reservation", label: "Reservation question" },
  { value: "long-stay", label: "Long stay / relocation" },
  { value: "services", label: "Guest services" },
  { value: "concept", label: "About the concept" },
];

/**
 * Contact form. Messages are persisted through POST /api/contact and shown
 * with an honest project-level disclosure instead of a simulated reply.
 */
export function ContactForm() {
  const [values, setValues] = useState({
    name: "",
    email: "",
    subject: subjects[0].value,
    message: "",
  });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  function validate(): ContactErrors {
    const next: ContactErrors = {};
    if (!values.name.trim()) next.name = "Please tell us your name.";
    if (!values.email.trim()) {
      next.email = "An email address is required so the message can be recorded.";
    } else if (!EMAIL_PATTERN.test(values.email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (!values.message.trim()) {
      next.message = "Please add a short message.";
    } else if (values.message.trim().length < 10) {
      next.message = "A little more detail would help.";
    }
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    setSubmitError(null);
    setSentTo(null);
    if (hasErrors(next)) return;

    setSubmitting(true);
    const result = await postJson<{ message: { id: number; receivedAt: string } }>(
      "/api/contact",
      {
        name: values.name.trim(),
        email: values.email.trim(),
        subject: values.subject,
        message: values.message.trim(),
      },
    );
    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.message);
      if (result.fields) setErrors(result.fields as ContactErrors);
      return;
    }

    setSentTo(values.name.trim());
    setValues({ name: "", email: "", subject: subjects[0].value, message: "" });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {sentTo ? (
        <StatusMessage tone="success" title={`Thanks, ${sentTo} — your message has been saved.`}>
          It is stored as part of this design concept. There is no live team monitoring this inbox,
          so a reply is not guaranteed.
        </StatusMessage>
      ) : null}

      {submitError ? (
        <StatusMessage tone="error" title="Message not saved" live>
          {submitError}
        </StatusMessage>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="contact-name" label="Your name" required error={errors.name}>
          <Input
            id="contact-name"
            value={values.name}
            autoComplete="name"
            invalid={Boolean(errors.name)}
            onChange={(event) => setValues((value) => ({ ...value, name: event.target.value }))}
          />
        </Field>

        <Field id="contact-email" label="Email" required error={errors.email}>
          <Input
            id="contact-email"
            type="email"
            value={values.email}
            autoComplete="email"
            invalid={Boolean(errors.email)}
            onChange={(event) => setValues((value) => ({ ...value, email: event.target.value }))}
          />
        </Field>
      </div>

      <Field id="contact-subject" label="Topic" error={errors.subject}>
        <Select
          id="contact-subject"
          value={values.subject}
          onChange={(event) => setValues((value) => ({ ...value, subject: event.target.value }))}
        >
          {subjects.map((subject) => (
            <option key={subject.value} value={subject.value}>
              {subject.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="contact-message" label="Message" required error={errors.message}>
        <Textarea
          id="contact-message"
          value={values.message}
          invalid={Boolean(errors.message)}
          placeholder="Tell us what you would like to know about the residence, the apartments or the design."
          onChange={(event) => setValues((value) => ({ ...value, message: event.target.value }))}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" loading={submitting}>
          {submitting ? "Saving" : "Send message"}
          {!submitting ? <Send aria-hidden="true" className="size-4" /> : null}
        </Button>
        <p className="max-w-xs text-[0.75rem] leading-relaxed text-charcoal/70">
          Messages are saved as part of this design concept. No payment or booking is created.
        </p>
      </div>
    </form>
  );
}
