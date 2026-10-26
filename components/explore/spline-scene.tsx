"use client";

import { Component, Suspense, type ErrorInfo, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Boxes, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ------------------------------------------------------------------
 * Spline integration point
 * ------------------------------------------------------------------
 * To connect a real interactive 3D scene:
 *
 *   1. Publish your scene at https://spline.design and copy the `.splinecode`
 *      export URL (it looks like:
 *      https://prod.spline.design/XXXXXXXXXXXX/scene.splinecode).
 *   2. Add it to `.env.local`:
 *
 *        NEXT_PUBLIC_SPLINE_SCENE_URL=https://prod.spline.design/XXXXXXXX/scene.splinecode
 *
 *   3. Restart `npm run dev`.
 *
 * If the variable is missing or empty, `<SplineScene />` renders its
 * `fallback` prop instead — the designed architectural illustration — with no
 * errors, no empty black canvas and no console warnings.
 * ------------------------------------------------------------------
 */

const sceneUrlFromEnv = process.env.NEXT_PUBLIC_SPLINE_SCENE_URL ?? "";

const SplineCanvas = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => <SceneLoading />,
});

function SceneLoading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-ivory/70">
      <Loader2 aria-hidden="true" className="size-5 spinner" />
      <p className="text-[0.7rem] tracking-[0.01em]">Preparing the view</p>
    </div>
  );
}

/** Renders the designed fallback when the scene throws instead of failing hard. */
class SceneErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("Spline scene failed to render, showing fallback.", error, info.componentStack);
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

interface SplineSceneProps {
  /** Overrides NEXT_PUBLIC_SPLINE_SCENE_URL when provided. */
  sceneUrl?: string;
  /** Rendered when no scene is configured. */
  fallback: ReactNode;
  className?: string;
}

export function SplineScene({ sceneUrl, fallback, className }: SplineSceneProps) {
  const resolvedUrl = (sceneUrl ?? sceneUrlFromEnv).trim();

  return (
    <div className={cn("relative overflow-hidden bg-ink", className)}>
      {resolvedUrl ? (
        <SceneErrorBoundary fallback={fallback}>
          <Suspense fallback={<SceneLoading />}>
            <SplineCanvas scene={resolvedUrl} style={{ width: "100%", height: "100%" }} />
          </Suspense>
        </SceneErrorBoundary>
      ) : (
        fallback
      )}
    </div>
  );
}

/** Small status chip explaining whether a live scene is connected. */
export function SplineStatus({ className }: { className?: string }) {
  const connected = sceneUrlFromEnv.trim().length > 0;

  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 text-[0.68rem] tracking-[0.01em]",
        connected ? "text-sage-soft" : "text-ivory/55",
        className,
      )}
    >
      <Boxes aria-hidden="true" className="size-3.5" />
      {connected ? "Interactive 3D view" : "Architectural illustration"}
    </p>
  );
}
