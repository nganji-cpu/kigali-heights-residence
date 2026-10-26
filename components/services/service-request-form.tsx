"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { StatusMessage } from "@/components/ui/status-message";
import { postJson } from "@/lib/api-client";
import { formatUSD } from "@/lib/utils";
import type { BookingRecord, Service } from "@/types";

interface ServiceRequestFormProps {
  services: Service[];
}

/**
 * Adds a service to an existing booking. This is a real write to the
 * `booking_services` table: the API verifies the reference, recalculates the
 * booking total on the server and returns the updated record.
 */
export function ServiceRequestForm({ services }: ServiceRequestFormProps) {
  const [reference, setReference] = useState("");
  const [serviceSlug, setServiceSlug] = useState(services[0]?.slug ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [result, setResult] = useState<BookingRecord | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFields({});
    setResult(null);

    const response = await postJson<{ booking: BookingRecord }>(
      "/api/service-requests",
      { reference: reference.trim(), serviceSlug },
    );

    setSubmitting(false);

    if (!response.ok) {
      setError(response.message);
      setFields(response.fields ?? {});
      return;
    }

    setResult(response.data.booking);
  }

  if (services.length === 0) {
    return (
      <StatusMessage tone="info" title="No guest services are available right now">
        Please check back soon.
      </StatusMessage>
    );
  }

  if (result) {
    const requested = result.services[result.services.length - 1];

    return (
      <div className="flex flex-col gap-6 border border-stone/80 bg-white p-6 sm:p-8">
        <StatusMessage tone="success" title="Service request recorded" live>
          {requested
            ? `${requested.name} was added to booking ${result.reference}.`
            : `Booking ${result.reference} was updated.`}{" "}
          The updated estimate is {formatUSD(result.price.total)}.
        </StatusMessage>

        <dl className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Booking", value: result.reference },
            { label: "Apartment", value: result.room.name },
            {
              label: "Service status",
              value: requested ? requested.status : "requested",
            },
            { label: "Updated total", value: formatUSD(result.price.total) },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-1 border-b border-stone/60 pb-3"
            >
              <dt className="text-[0.64rem] tracking-[0.01em] text-charcoal/70">
                {item.label}
              </dt>
              <dd className="text-[0.92rem] text-charcoal">{item.value}</dd>
            </div>
          ))}
        </dl>

        <div>
          <Button
            variant="secondary"
            onClick={() => {
              setResult(null);
              setReference("");
              setError(null);
              setFields({});
            }}
          >
            Request another service
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 border border-stone/80 bg-white p-6 sm:p-8"
    >
      <Field
        id="service-reference"
        label="Booking reference"
        required
        error={fields.reference}
        hint="From your confirmation, for example KHR-1A2B3C4D"
      >
        <Input
          id="service-reference"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="KHR-XXXXXXXX"
          autoComplete="off"
          spellCheck={false}
          invalid={Boolean(fields.reference)}
        />
      </Field>

      <Field
        id="service-choice"
        label="Service to add"
        required
        error={fields.serviceSlug}
      >
        <Select
          id="service-choice"
          value={serviceSlug}
          onChange={(event) => setServiceSlug(event.target.value)}
          invalid={Boolean(fields.serviceSlug)}
        >
          {services.map((service) => (
            <option key={service.id} value={service.slug}>
              {service.name} — from {formatUSD(service.samplePrice)}
            </option>
          ))}
        </Select>
      </Field>

      {error ? (
        <StatusMessage tone="error" title="Request not recorded" live>
          {error}
        </StatusMessage>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" loading={submitting}>
          Request this service
          <Send aria-hidden="true" className="size-4" />
        </Button>
        <p className="max-w-sm text-[0.78rem] leading-relaxed text-charcoal/70">
          The reference is checked, the service is attached to the booking and the total is
          recalculated.
        </p>
      </div>
    </form>
  );
}
