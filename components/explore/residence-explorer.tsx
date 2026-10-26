"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, Check, Layers, Users } from "lucide-react";
import { BuildingDiagram } from "@/components/explore/building-diagram";
import { SplineScene, SplineStatus } from "@/components/explore/spline-scene";
import { ButtonLink } from "@/components/ui/button";
import { residenceLevels } from "@/data/levels";
import { getRoomsOnLevel } from "@/data/rooms";
import { cn, formatUSD, pluralize } from "@/lib/utils";
import type { LevelNumber } from "@/types";

const levels: LevelNumber[] = [1, 2, 3, 4, 5];

/**
 * Interactive five-level explorer: level controls, a viewer area that hosts the
 * Spline scene (or its architectural fallback), and a description panel with
 * the apartments available on the selected level.
 */
export function ResidenceExplorer() {
  const [activeLevel, setActiveLevel] = useState<LevelNumber>(5);

  const level = useMemo(
    () => residenceLevels.find((entry) => entry.level === activeLevel) ?? residenceLevels[4],
    [activeLevel],
  );

  const levelRooms = useMemo(() => getRoomsOnLevel(activeLevel), [activeLevel]);

  const roomsHref = level.category ? `/rooms?category=${level.category}` : "/rooms";
  const roomsLabel = level.category
    ? `Explore rooms on level ${activeLevel}`
    : "Browse all accommodation";

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-12">
      {/* ------------------------------- Viewer ------------------------------- */}
      <div className="flex flex-col gap-6">
        <SplineScene
          className="relative aspect-[4/3] w-full border border-stone/25 sm:aspect-[16/11]"
          fallback={<BuildingDiagram activeLevel={activeLevel} />}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SplineStatus />
          <p className="text-[0.68rem] tracking-[0.01em] text-charcoal/70">
            Level {activeLevel} of 5
          </p>
        </div>

        {/* Level controls */}
        <div
          role="tablist"
          aria-label="Select a level of the residence"
          className="grid grid-cols-2 gap-2 sm:grid-cols-5"
        >
          {levels.map((value) => {
            const entry = residenceLevels.find((item) => item.level === value)!;
            const active = value === activeLevel;

            return (
              <button
                key={value}
                type="button"
                role="tab"
                id={`level-tab-${value}`}
                aria-selected={active}
                aria-controls="level-panel"
                onClick={() => setActiveLevel(value)}
                className={cn(
                  "flex flex-col gap-1.5 border px-4 py-3.5 text-left transition-all duration-300",
                  active
                    ? "border-bronze bg-bronze/10"
                    : "border-stone/80 bg-white hover:border-charcoal/40",
                )}
              >
                <span
                  className={cn(
                    "flex items-center gap-2 text-[0.66rem] font-medium tracking-[0.01em]",
                    active ? "text-charcoal" : "text-charcoal/70",
                  )}
                >
                  <Layers aria-hidden="true" className="size-3.5" />
                  Level {value}
                </span>
                <span
                  className={cn(
                    "font-display text-lg leading-tight",
                    active ? "text-charcoal" : "text-charcoal/75",
                  )}
                >
                  {entry.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------- Panel -------------------------------- */}
      <div
        id="level-panel"
        role="tabpanel"
        aria-labelledby={`level-tab-${activeLevel}`}
        tabIndex={-1}
        className="flex flex-col"
      >
        <div key={activeLevel} className="panel-in flex flex-col gap-7">
          <div className="frame relative aspect-[16/10] w-full">
            <Image
              src={level.image}
              alt={level.imageAlt}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
            <span className="absolute left-0 top-0 bg-charcoal/85 px-3 py-2 text-[0.62rem] font-medium tracking-[0.01em] text-ivory backdrop-blur-sm">
              Level {level.level} · {level.name}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-display text-3xl leading-tight sm:text-[2.15rem]">
              {level.tagline}
            </h3>
            <p className="text-[0.95rem] leading-relaxed text-charcoal/70">{level.description}</p>
          </div>

          <ul className="flex flex-col gap-2.5">
            {level.facilities.map((facility) => (
              <li key={facility} className="flex items-start gap-2.5 text-[0.88rem] text-charcoal/75">
                <Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-bronze" />
                {facility}
              </li>
            ))}
          </ul>

          {levelRooms.length > 0 ? (
            <div className="flex flex-col gap-4 border-t border-stone/70 pt-6">
              <h4 className="flex items-center gap-2 text-[0.7rem] font-medium tracking-[0.01em] text-charcoal/70">
                <Building2 aria-hidden="true" className="size-3.5 text-bronze" />
                {levelRooms.length} {pluralize(levelRooms.length, "apartment")} on this level
              </h4>
              <ul className="flex flex-col divide-y divide-stone/60 border-y border-stone/60">
                {levelRooms.map((room) => (
                  <li key={room.id}>
                    <Link
                      href={`/rooms/${room.slug}`}
                      className="group flex items-center justify-between gap-4 py-3.5"
                    >
                      <span className="flex flex-col">
                        <span className="font-display text-xl leading-tight group-hover:text-bronze">
                          {room.name}
                        </span>
                        <span className="flex items-center gap-2 text-[0.78rem] text-charcoal/70">
                          <Users aria-hidden="true" className="size-3.5" />
                          Sleeps {room.capacity} · {room.size} m²
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-display text-lg">
                          {formatUSD(room.pricePerNight)}
                        </span>
                        <span className="block text-[0.66rem] tracking-[0.01em] text-charcoal/70">
                          per night
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="border-t border-stone/70 pt-6 text-[0.88rem] leading-relaxed text-charcoal/70">
              Level one holds the arrival experience rather than guest apartments reception, the
              concierge desk and the guest lounge.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href={roomsHref}>
              {roomsLabel}
              <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
            <ButtonLink href="/book" variant="secondary">
              Reserve your stay
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
