"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RoomStatus } from "@/types";
import { postJson } from "@/lib/api-client";

const options: Array<{ value: RoomStatus; label: string }> = [
  { value: "available", label: "Available to book" },
  { value: "occupied", label: "Occupied" },
  { value: "maintenance", label: "Maintenance" },
  { value: "inactive", label: "Inactive" },
];

export function RoomStatusControl({ slug, status }: { slug: string; status: RoomStatus }) {
  const router = useRouter();
  const [value, setValue] = useState<RoomStatus>(status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update() {
    if (busy || value === status) return;
    setBusy(true);
    setError(null);

    const result = await postJson<{ ok: boolean }>(`/api/admin/rooms/${slug}`, { status: value });

    if (!result.ok) {
      setError(result.message);
      setBusy(false);
      return;
    }

    router.refresh();
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={value}
          onChange={(event) => setValue(event.target.value as RoomStatus)}
          disabled={busy}
          aria-label={`Status for ${slug}`}
          className="border border-stone/90 bg-white px-2.5 py-1.5 text-[0.78rem] text-charcoal focus:border-bronze focus:outline-none"
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
          className="border border-charcoal/25 px-2.5 py-1.5 text-[0.74rem] transition-colors hover:border-charcoal hover:bg-charcoal hover:text-ivory disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Saving" : "Update"}
        </button>
      </div>
      {error ? <span className="text-[0.7rem] text-red-700">{error}</span> : null}
    </div>
  );
}
