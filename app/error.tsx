"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/status-message";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the console so the failure is easy to find during review.
    console.error("Kigali Heights Residence — route error:", error);
  }, [error]);

  return (
    <section className="bg-ivory py-24 lg:py-32">
      <div className="shell flex max-w-2xl flex-col gap-8">
        <span className="eyebrow">Something went wrong</span>
        <h1 className="font-display text-4xl leading-tight text-balance-tight sm:text-5xl">
          This part of the concept did not load properly.
        </h1>
        <p className="text-[1rem] leading-relaxed text-charcoal/70">
          An unexpected error interrupted the page. You can retry the view, or return to the
          entrance and start again.
        </p>

        <StatusMessage tone="error" title="Unexpected error">
          {error.message || "No further detail is available."}
          {error.digest ? ` (reference ${error.digest})` : ""}
        </StatusMessage>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="lg" onClick={reset}>
            <RotateCcw aria-hidden="true" className="size-4" />
            Try again
          </Button>
          <ButtonLink href="/" variant="secondary" size="lg">
            Back to home
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
