"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { StatusMessage } from "@/components/ui/status-message";
import { postJson } from "@/lib/api-client";
import type { PaymentRecord } from "@/types";

const methods = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "card", label: "Card" },
  { value: "mobile_money", label: "Mobile money" },
  { value: "other", label: "Other" },
];

const statuses = [
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export function PaymentForm({ references }: { references: string[] }) {
  const router = useRouter();
  const [values, setValues] = useState({
    bookingReference: "",
    amount: "",
    method: "bank_transfer",
    status: "completed",
    transactionReference: "",
    paidAt: "",
    notes: "",
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

    const result = await postJson<{ payment: PaymentRecord }>("/api/admin/payments", {
      bookingReference: values.bookingReference.trim(),
      amount: values.amount,
      method: values.method,
      status: values.status,
      transactionReference: values.transactionReference.trim(),
      paidAt: values.paidAt || null,
      notes: values.notes.trim(),
    });

    if (!result.ok) {
      setMessage(result.message);
      if (result.fields) setErrors(result.fields);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setMessage(`Payment recorded for ${result.data.payment.bookingReference}.`);
    setValues({
      bookingReference: "",
      amount: "",
      method: "bank_transfer",
      status: "completed",
      transactionReference: "",
      paidAt: "",
      notes: "",
    });
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
          id="payment-reference"
          label="Booking reference"
          required
          error={errors.bookingReference}
          className="sm:col-span-2"
        >
          <Input
            id="payment-reference"
            list="payment-references"
            value={values.bookingReference}
            placeholder="KHR-XXXXXXXX"
            invalid={Boolean(errors.bookingReference)}
            onChange={(event) => update("bookingReference", event.target.value.toUpperCase())}
          />
          <datalist id="payment-references">
            {references.map((reference) => (
              <option key={reference} value={reference} />
            ))}
          </datalist>
        </Field>

        <Field id="payment-amount" label="Amount (USD)" required error={errors.amount}>
          <Input
            id="payment-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={values.amount}
            invalid={Boolean(errors.amount)}
            onChange={(event) => update("amount", event.target.value)}
          />
        </Field>

        <Field id="payment-method" label="Method" required error={errors.method}>
          <Select
            id="payment-method"
            value={values.method}
            invalid={Boolean(errors.method)}
            onChange={(event) => update("method", event.target.value)}
          >
            {methods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="payment-status" label="Status" required error={errors.status}>
          <Select
            id="payment-status"
            value={values.status}
            invalid={Boolean(errors.status)}
            onChange={(event) => update("status", event.target.value)}
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="payment-date" label="Paid at" hint="Optional" error={errors.paidAt}>
          <Input
            id="payment-date"
            type="date"
            value={values.paidAt}
            invalid={Boolean(errors.paidAt)}
            onChange={(event) => update("paidAt", event.target.value)}
          />
        </Field>

        <Field
          id="payment-transaction"
          label="Transaction reference"
          hint="Optional"
          error={errors.transactionReference}
          className="sm:col-span-2"
        >
          <Input
            id="payment-transaction"
            value={values.transactionReference}
            invalid={Boolean(errors.transactionReference)}
            onChange={(event) => update("transactionReference", event.target.value)}
          />
        </Field>

        <Field id="payment-notes" label="Notes" hint="Optional" error={errors.notes} className="sm:col-span-2">
          <Textarea
            id="payment-notes"
            value={values.notes}
            invalid={Boolean(errors.notes)}
            onChange={(event) => update("notes", event.target.value)}
          />
        </Field>
      </div>

      <Button type="submit" loading={submitting}>
        {submitting ? "Recording" : "Record payment"}
      </Button>
    </form>
  );
}
