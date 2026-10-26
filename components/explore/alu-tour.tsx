"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ExternalLink, Loader2, RotateCw } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The ALU Kigali360 tour is a separate, externally hosted campus walkthrough.
 * Replace this one constant when a residence-specific tour is available; the
 * rest of the section can stay as it is.
 *
 * Note: this is intentionally not the Kigali Heights Residence property. The
 * notice below the frame says so, and the tour is never scraped or proxied.
 */
export const ALU_TOUR_URL = "https://alu.kigali360.net/";

const SLOW_AFTER_MS = 12_000;

type EmbedState = "loading" | "ready" | "slow";

export function AluTour() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [visible, setVisible] = useState(false);

  // The iframe is lazy-loaded, so start the "slow" clock only once the tour is
  // near the viewport. Otherwise visitors who read the page first would see a
  // failure message before the browser had even requested the tour.
  useEffect(() => {
    const node = frameRef.current;
    if (!node || visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (loaded || !visible) return;

    const timer = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [attempt, loaded, visible]);

  const state: EmbedState = loaded ? "ready" : slow ? "slow" : "loading";

  function reload() {
    setLoaded(false);
    setSlow(false);
    setAttempt((value) => value + 1);
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        ref={frameRef}
        className="relative aspect-[16/10] w-full overflow-hidden border border-stone/80 bg-charcoal"
      >
        <iframe
          key={attempt}
          src={ALU_TOUR_URL}
          title="ALU Kigali360 campus tour (external)"
          onLoad={() => setLoaded(true)}
          loading="lazy"
          allow="fullscreen; autoplay; xr-spatial-tracking"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className={cn(
            "absolute inset-0 h-full w-full border-0 transition-opacity duration-500",
            state === "ready" ? "opacity-100" : "opacity-0",
          )}
        />

        {state !== "ready" ? (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
            role="status"
            aria-live="polite"
          >
            {state === "slow" ? (
              <>
                <AlertTriangle aria-hidden="true" className="size-8 text-bronze-soft" />
                <p className="font-display text-2xl text-ivory">
                  The embedded tour did not appear.
                </p>
                <p className="max-w-md text-[0.9rem] leading-relaxed text-ivory/70">
                  Some browsers and networks block third-party tours from loading
                  inside another page. The tour itself is available — open it in a
                  new tab using the button below.
                </p>
              </>
            ) : (
              <>
                <Loader2
                  aria-hidden="true"
                  className="spinner size-7 text-bronze-soft"
                />
                <p className="text-[0.72rem] tracking-[0.01em] text-ivory/70">
                  Connecting to the tour
                </p>
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={ALU_TOUR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ size: "md" })}
        >
          Open the ALU tour
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
        <button
          type="button"
          onClick={reload}
          className={buttonClasses({ variant: "secondary", size: "md" })}
        >
          <RotateCw aria-hidden="true" className="size-4" />
          Reload tour
        </button>
      </div>

      <p className="text-[0.8rem] leading-relaxed text-charcoal/70">
        The tour is hosted by ALU Kigali360. If the frame stays blank, your browser or network may
        be blocking the embed; open it directly using the button above.
      </p>

      <div className="border border-bronze/35 bg-bronze/8 px-4 py-3.5 text-[0.8rem] leading-relaxed text-charcoal/80">
        <strong className="font-medium text-charcoal">A separate live tour.</strong> This is the
        public ALU Kigali360 campus tour, included as a reference for immersive property
        exploration. It is not Kigali Heights Residence and does not show these apartments.
      </div>
    </div>
  );
}
