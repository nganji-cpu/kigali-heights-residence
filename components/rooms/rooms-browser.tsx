"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, X } from "lucide-react";
import { RoomCard } from "@/components/rooms/room-card";
import { NotFoundState } from "@/components/ui/not-found-state";
import { categoryLabels, roomCategories } from "@/data/rooms";
import { cn, pluralize } from "@/lib/utils";
import type { Room, RoomCategory } from "@/types";

interface RoomsBrowserProps {
  rooms: Room[];
  initialCategory: RoomCategory | "all";
  initialLevel: 2 | 3 | 4 | 5 | "all";
}

type CategoryFilter = RoomCategory | "all";
/** Levels that hold guest apartments (level 1 is the arrival floor). */
type RoomLevel = 2 | 3 | 4 | 5;
type LevelFilter = RoomLevel | "all";

const levelOptions: LevelFilter[] = ["all", 2, 3, 4, 5];

const levelDescriptions: Record<RoomLevel, string> = {
  2: "Standard apartments",
  3: "Deluxe apartments",
  4: "Executive suites",
  5: "Penthouse residence",
};

/**
 * Client-side accommodation browser.
 *
 * Filtering happens instantly in the browser from the full room list passed in
 * by the server. The URL is kept in sync with `history.replaceState` so a
 * filtered view can be shared or reloaded without triggering a navigation.
 */
export function RoomsBrowser({ rooms, initialCategory, initialLevel }: RoomsBrowserProps) {
  const [category, setCategory] = useState<CategoryFilter>(initialCategory);
  const [level, setLevel] = useState<LevelFilter>(initialLevel);

  const results = useMemo(
    () =>
      rooms.filter((room) => {
        const matchesCategory = category === "all" || room.category === category;
        const matchesLevel = level === "all" || room.floor === level;
        return matchesCategory && matchesLevel;
      }),
    [rooms, category, level],
  );

  // Keep the address bar shareable without an RSC round trip (no flicker).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (level !== "all") params.set("level", String(level));
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [category, level]);

  const hasFilters = category !== "all" || level !== "all";

  function resetFilters() {
    setCategory("all");
    setLevel("all");
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6 border border-stone/80 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3">
          <span className="text-[0.68rem] font-medium uppercase tracking-[0.2em] text-charcoal/55">
            Apartment type
          </span>
          <div className="flex flex-wrap gap-2">
            {roomCategories.map((option) => {
              const active = option.value === category;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(option.value)}
                  className={cn(
                    "border px-4 py-2.5 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300",
                    active
                      ? "border-charcoal bg-charcoal text-ivory"
                      : "border-stone/90 text-charcoal/75 hover:border-charcoal hover:text-charcoal",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-stone/70 pt-6">
          <span className="text-[0.68rem] font-medium uppercase tracking-[0.2em] text-charcoal/55">
            Building level
          </span>
          <div className="flex flex-wrap gap-2">
            {levelOptions.map((option) => {
              const active = option === level;
              return (
                <button
                  key={String(option)}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setLevel(option)}
                  className={cn(
                    "flex flex-col items-start border px-4 py-2.5 text-left transition-colors duration-300",
                    active
                      ? "border-bronze bg-bronze/10"
                      : "border-stone/90 hover:border-charcoal/40",
                  )}
                >
                  <span
                    className={cn(
                      "text-[0.72rem] font-medium uppercase tracking-[0.16em]",
                      active ? "text-bronze" : "text-charcoal/75",
                    )}
                  >
                    {option === "all" ? "All levels" : `Level ${option}`}
                  </span>
                  <span className="text-[0.7rem] text-charcoal/50">
                    {option === "all"
                      ? "Across the residence"
                      : levelDescriptions[option]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="flex items-center gap-2.5 font-display text-2xl">
          <LayoutGrid aria-hidden="true" className="size-4 text-bronze" />
          {results.length} {pluralize(results.length, "apartment")}
          {category !== "all" ? ` · ${categoryLabels[category]}` : ""}
          {level !== "all" ? ` · Level ${level}` : ""}
        </h2>

        {hasFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-charcoal/60 underline-offset-4 hover:text-bronze hover:underline"
          >
            <X aria-hidden="true" className="size-3.5" />
            Clear filters
          </button>
        ) : (
          <p className="text-[0.72rem] uppercase tracking-[0.16em] text-charcoal/45">
            Rates are illustrative samples
          </p>
        )}
      </div>

      {results.length > 0 ? (
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((room) => (
            <li key={room.id} className="h-full">
              <RoomCard room={room} />
            </li>
          ))}
        </ul>
      ) : (
        <NotFoundState
          eyebrow="No match"
          title="No apartments fit that combination."
          description="Try a different apartment type or level the residence holds six apartments across levels two to five."
          primary={{ href: "/rooms", label: "Reset the view" }}
          secondary={{ href: "/book", label: "Reserve your stay" }}
        />
      )}
    </div>
  );
}
