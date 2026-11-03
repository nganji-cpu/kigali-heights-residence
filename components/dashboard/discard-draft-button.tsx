"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DiscardDraftButton({ draftId }: { draftId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function discard() {
    if (busy) return;
    if (!window.confirm("Discard this saved draft? This cannot be undone.")) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/drafts/${draftId}`, { method: "DELETE" });
      if (!response.ok) {
        setError("The draft could not be discarded. Please try again.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={discard}
        disabled={busy}
        className="text-[0.78rem] text-charcoal/60 underline-offset-4 transition-colors hover:text-red-700 hover:underline disabled:opacity-45"
      >
        {busy ? "Discarding..." : "Discard"}
      </button>
      {error ? <span className="text-[0.72rem] text-red-700">{error}</span> : null}
    </span>
  );
}
