"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingStatus } from "@/types";
import { postJson } from "@/lib/api-client";

const options: Array<{ value: "pending" | "confirmed" | "cancelled"; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

export function ReservationStatusControl({
  reference,
  status,
}: {
  reference: string;
  status: BookingStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status === "draft" ? "pending" : status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update() {
    if (busy || value === status) return;
    setBusy(true);
    setError(null);

    const result = await postJson<{ ok: boolean }>(
      `/api/admin/reservations/${reference}`,
      { status: value },
    );

    if (!result.ok) {
      setError(result.message);
      setBusy(false);
      return;
    }

    router.refresh();
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex items-center gap-2">
        <select
          value={value}
          onChange={(event) => setValue(event.target.value as typeof value)}
          disabled={busy}
          aria-label={`Status for ${reference}`}
          className="border border-stone/90 bg-white px-2.5 py-1.5 text-[0.76rem] text-charcoal focus:border-bronze focus:outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={update}
          disabled={busy || value === status}
          className="border border-charcoal/25 px-2.5 py-1.5 text-[0.72rem] transition-colors hover:border-charcoal hover:bg-charcoal hover:text-ivory disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Saving" : "Update"}
        </button>
      </div>
      {error ? <span className="text-[0.7rem] text-red-700">{error}</span> : null}
    </div>
  );
}
