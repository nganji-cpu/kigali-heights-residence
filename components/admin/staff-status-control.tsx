"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserStatus } from "@/types";
import { postJson } from "@/lib/api-client";

const options: Array<{ value: UserStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

export function StaffStatusControl({ id, status }: { id: number; status: UserStatus }) {
  const router = useRouter();
  const [value, setValue] = useState<UserStatus>(status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update() {
    if (busy || value === status) return;
    setBusy(true);
    setError(null);

    const result = await postJson<{ user: unknown }>(`/api/admin/staff/${id}`, { status: value });

    if (!result.ok) {
      setError(result.message);
      setBusy(false);
      return;
    }

    router.refresh();
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <select
          value={value}
          onChange={(event) => setValue(event.target.value as UserStatus)}
          disabled={busy}
          aria-label={`Account status for team member ${id}`}
          className="border border-stone/90 bg-white px-2.5 py-1.5 text-[0.75rem] text-charcoal focus:border-bronze focus:outline-none"
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
