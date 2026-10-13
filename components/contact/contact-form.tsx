"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { StatusMessage } from "@/components/ui/status-message";
import { hasErrors } from "@/lib/booking";

type ContactErrors = Partial<Record<"name" | "email" | "message", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

const subjects = [
  { value: "general", label: "General enquiry" },
  { value: "reservation", label: "Reservation question" },
  { value: "long-stay", label: "Long stay / relocation" },
  { value: "services", label: "Guest services" },
  { value: "concept", label: "About the concept" },
];

/**
 * Contact form with inline validation. Submission is simulated — the form
 * validates, shows a confirmation and resets, but sends nothing anywhere.
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
  const [sent, setSent] = useState<string | null>(null);

  function validate(): ContactErrors {
    const next: ContactErrors = {};
    if (!values.name.trim()) next.name = "Please tell us your name.";
    if (!values.email.trim()) {
      next.email = "An email address is required so we can reply.";
    } else if (!EMAIL_PATTERN.test(values.email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (!values.message.trim()) {
      next.message = "Please add a short message.";
    } else if (values.message.trim().length < 10) {
      next.message = "A little more detail would help us respond well.";
    }
    return next;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (hasErrors(next)) return;

    setSubmitting(true);
    window.setTimeout(() => {
      setSent(values.name.trim());
      setSubmitting(false);
      setValues({ name: "", email: "", subject: subjects[0].value, message: "" });
    }, 600);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {sent ? (
        <StatusMessage tone="success" title={`Thanks, ${sent} — message received.`}>
          This is a demonstration only. Nothing was sent, and no one will reply.
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

      <Field id="contact-subject" label="Topic">
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
          placeholder="Tell us about your stay, dates or anything you would like help with."
          onChange={(event) => setValues((value) => ({ ...value, message: event.target.value }))}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" loading={submitting}>
          {submitting ? "Sending" : "Send message"}
          {!submitting ? <Send aria-hidden="true" className="size-4" /> : null}
        </Button>
        <p className="text-[0.75rem] text-charcoal/50">
          Demonstration form no message is actually delivered.
        </p>
      </div>
    </form>
  );
}
