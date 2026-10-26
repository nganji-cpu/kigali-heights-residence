"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { RoomCard } from "@/components/rooms/room-card";
import { NotFoundState } from "@/components/ui/not-found-state";
import { StatusMessage } from "@/components/ui/status-message";
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

/**
 * Client-side apartment browser.
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
      <div className="flex flex-col gap-5 border-y border-stone/80 py-5 sm:flex-row sm:items-start sm:gap-12">
        <div className="flex flex-col gap-3">
          <span className="text-[0.7rem] text-charcoal/70">Apartment type</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {roomCategories.map((option) => {
              const active = option.value === category;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(option.value)}
                  className={cn(
                    "border-b pb-1 text-[0.78rem] font-medium transition-colors duration-300",
                    active
                      ? "border-bronze text-bronze"
                      : "border-transparent text-charcoal/65 hover:text-charcoal",
                  )}
                >
                  {option.value === "all" ? "All apartments" : option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:border-l sm:border-stone/70 sm:pl-12">
          <span className="text-[0.7rem] text-charcoal/70">Building level</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {levelOptions.map((option) => {
              const active = option === level;
              return (
                <button
                  key={String(option)}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setLevel(option)}
                  className={cn(
                    "border-b pb-1 text-[0.78rem] font-medium transition-colors duration-300",
                    active
                      ? "border-bronze text-bronze"
                      : "border-transparent text-charcoal/65 hover:text-charcoal",
                  )}
                >
                  {option === "all" ? "All levels" : `Level ${option}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {rooms.length === 0 ? (
        <StatusMessage tone="info" title="No apartments are available right now.">
          Please check back soon, or read about the residence in the meantime.
        </StatusMessage>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-display text-2xl">
              {results.length} {pluralize(results.length, "apartment")}
              {category !== "all" ? ` · ${categoryLabels[category]}` : ""}
              {level !== "all" ? ` · Level ${level}` : ""}
            </h2>

            {hasFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-charcoal/70 underline-offset-4 hover:text-bronze hover:underline"
              >
                <X aria-hidden="true" className="size-3.5" />
                Clear filters
              </button>
            ) : (
              <p className="text-[0.75rem] text-charcoal/70">Rates per night, in USD</p>
            )}
          </div>

          {results.length > 0 ? (
            <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
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
              description="Try another apartment type or level, or clear the filters to see all six apartments."
              primary={{ href: "/rooms", label: "Reset the view" }}
              secondary={{ href: "/book", label: "Reserve a stay" }}
            />
          )}
        </>
      )}
    </div>
  );
}
