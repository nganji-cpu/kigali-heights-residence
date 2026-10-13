"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Sparkles, Trash2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ServiceCard } from "@/components/services/service-card";
import { serviceCategoryLabels } from "@/data/services";
import { writeSelectedServices } from "@/lib/booking";
import { useSelectedServices } from "@/lib/client-store";
import { cn, formatUSD, pluralize } from "@/lib/utils";
import type { Service, ServiceCategory } from "@/types";

interface ServicePlannerProps {
  services: Service[];
}

type CategoryFilter = ServiceCategory | "all";

const categoryOrder: ServiceCategory[] = ["transport", "dining", "lifestyle", "business"];

/**
 * Guest-service selector. Choices are written to `localStorage` under
 * `khr.services.selected.v1` and picked up automatically by the booking flow,
 * so a guest can plan services here and reserve later.
 */
export function ServicePlanner({ services }: ServicePlannerProps) {
  const storedSelection = useSelectedServices();
  const [selection, setSelection] = useState<string[] | null>(null);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [justSaved, setJustSaved] = useState(false);
  const savedTimeout = useRef<number | null>(null);

  // Stored choices seed the panel; the local override keeps toggles instant
  // while still writing through to storage.
  const selected = selection ?? storedSelection;

  useEffect(() => {
    return () => {
      if (savedTimeout.current !== null) window.clearTimeout(savedTimeout.current);
    };
  }, []);

  const visible = useMemo(
    () => services.filter((service) => category === "all" || service.category === category),
    [services, category],
  );

  const selectedServices = useMemo(
    () => services.filter((service) => selected.includes(service.slug)),
    [services, selected],
  );

  const runningFrom = selectedServices.reduce((sum, service) => sum + service.samplePrice, 0);

  function flashSaved() {
    if (savedTimeout.current !== null) window.clearTimeout(savedTimeout.current);
    setJustSaved(true);
    savedTimeout.current = window.setTimeout(() => setJustSaved(false), 2200);
  }

  function toggle(slug: string) {
    const next = selected.includes(slug)
      ? selected.filter((item) => item !== slug)
      : [...selected, slug];
    setSelection(next);
    writeSelectedServices(next);
    if (next.length > 0) flashSaved();
  }

  function clear() {
    setSelection([]);
    writeSelectedServices([]);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {(["all", ...categoryOrder] as CategoryFilter[]).map((option) => {
          const active = option === category;
          const label = option === "all" ? "All services" : serviceCategoryLabels[option];
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(option)}
              className={cn(
                "border px-4 py-2.5 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300",
                active
                  ? "border-charcoal bg-charcoal text-ivory"
                  : "border-stone/90 text-charcoal/75 hover:border-charcoal hover:text-charcoal",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        {/* Cards */}
        <ul className="grid gap-8 sm:grid-cols-2">
          {visible.map((service) => (
            <li key={service.id} className="h-full">
              <ServiceCard
                service={service}
                selected={selected.includes(service.slug)}
                onToggle={toggle}
              />
            </li>
          ))}
        </ul>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="flex flex-col gap-5 border border-stone/80 bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-2xl">
                <Sparkles aria-hidden="true" className="size-4 text-bronze" />
                My stay
              </h2>
              <span className="text-[0.68rem] uppercase tracking-[0.16em] text-charcoal/50">
                {selected.length} {pluralize(selected.length, "service")}
              </span>
            </div>

            {selectedServices.length > 0 ? (
              <>
                <ul className="flex flex-col divide-y divide-stone/60 border-y border-stone/60">
                  {selectedServices.map((service) => (
                    <li
                      key={service.id}
                      className="flex items-center justify-between gap-3 py-3 text-[0.88rem]"
                    >
                      <span className="flex items-center gap-2 text-charcoal">
                        <Check aria-hidden="true" className="size-3.5 text-bronze" />
                        {service.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-charcoal/60">
                        from {formatUSD(service.samplePrice)}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="flex items-baseline justify-between gap-3">
                  <span className="text-[0.72rem] uppercase tracking-[0.16em] text-charcoal/55">
                    Sample add-on subtotal
                  </span>
                  <span className="font-display text-2xl">{formatUSD(runningFrom)}</span>
                </p>

                <p className="text-[0.74rem] leading-relaxed text-charcoal/50">
                  Final amounts depend on nights and guests; the exact figure is calculated in the
                  reservation summary.
                </p>
              </>
            ) : (
              <p className="text-[0.88rem] leading-relaxed text-charcoal/60">
                Nothing selected yet. Add the services you would like and they will carry through
                to your reservation.
              </p>
            )}

            <div className="flex flex-col gap-3">
              <ButtonLink href="/book" className="w-full">
                Continue to reservation
              </ButtonLink>
              {selectedServices.length > 0 ? (
                <button
                  type="button"
                  onClick={clear}
                  className="inline-flex items-center justify-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-charcoal/60 underline-offset-4 hover:text-bronze hover:underline"
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                  Clear selection
                </button>
              ) : null}
            </div>

            <p
              role="status"
              aria-live="polite"
              className={cn(
                "text-[0.72rem] text-sage transition-opacity duration-500",
                justSaved ? "opacity-100" : "opacity-0",
              )}
            >
              Saved to this browser.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
