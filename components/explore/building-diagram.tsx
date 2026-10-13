import { residenceLevels } from "@/data/levels";
import type { LevelNumber } from "@/types";
import { cn } from "@/lib/utils";

interface BuildingDiagramProps {
  activeLevel: LevelNumber;
  className?: string;
}

/**
 * Simplified architectural elevation of the five-level concept residence.
 *
 * This is the designed fallback shown in the Explore page viewer while no
 * Spline scene is connected. It is a static illustration, not a 3D model.
 */
export function BuildingDiagram({ activeLevel, className }: BuildingDiagramProps) {
  // Floor geometry, drawn bottom-up inside a 0 0 360 460 viewBox.
  const floorHeight = 68;
  const floorGap = 6;
  const baseY = 372;
  const buildingX = 88;
  const buildingWidth = 184;

  const floorTop = (level: number) =>
    baseY - level * floorHeight - (level - 1) * floorGap;

  return (
    <div className={cn("relative flex h-full w-full items-center justify-center", className)}>
      <svg
        viewBox="0 0 360 460"
        role="img"
        aria-label={`Architectural elevation of the residence with level ${activeLevel} highlighted`}
        className="h-full w-full max-h-[520px]"
      >
        {/* Hill silhouettes behind the building */}
        <path
          d="M0 372 C 60 330, 110 352, 168 330 C 220 310, 268 336, 360 300 L360 460 L0 460 Z"
          className="fill-sage/25"
        />
        <path
          d="M0 400 C 70 372, 130 392, 190 372 C 244 354, 300 374, 360 352 L360 460 L0 460 Z"
          className="fill-sage/15"
        />

        {/* Rooftop terrace markers */}
        <line
          x1={buildingX - 18}
          y1={floorTop(5) - 14}
          x2={buildingX + buildingWidth + 18}
          y2={floorTop(5) - 14}
          className="stroke-bronze/50"
          strokeWidth="1.5"
        />
        <circle cx={buildingX - 18} cy={floorTop(5) - 14} r="3" className="fill-bronze/70" />
        <circle
          cx={buildingX + buildingWidth + 18}
          cy={floorTop(5) - 14}
          r="3"
          className="fill-bronze/70"
        />

        {/* Ground line */}
        <line
          x1={buildingX - 30}
          y1={baseY}
          x2={buildingX + buildingWidth + 30}
          y2={baseY}
          className="stroke-ivory/25"
          strokeWidth="1.5"
        />

        {residenceLevels.map((level) => {
          const index = level.level as LevelNumber;
          const active = index === activeLevel;
          const y = floorTop(index);
          const inset = index === 5 ? 20 : index === 1 ? -8 : 0;
          const x = buildingX + inset;
          const width = buildingWidth - inset * 2;

          return (
            <g key={level.level}>
              <rect
                x={x}
                y={y}
                width={width}
                height={floorHeight}
                className={cn(
                  "transition-all duration-500",
                  active ? "fill-bronze/85" : "fill-ivory/8",
                )}
                stroke={active ? "transparent" : "rgba(247,244,238,0.22)"}
                strokeWidth="1"
              />

              {/* Window rhythm */}
              {[0, 1, 2].map((column) => (
                <rect
                  key={column}
                  x={x + 18 + column * (width / 3)}
                  y={y + 20}
                  width={width / 3 - 30}
                  height={floorHeight - 40}
                  className={active ? "fill-ink/25" : "fill-ivory/10"}
                />
              ))}

              <text
                x={buildingX - 34}
                y={y + floorHeight / 2 + 5}
                textAnchor="middle"
                className={cn(
                  "text-[15px] font-medium transition-colors duration-500",
                  active ? "fill-bronze" : "fill-ivory/45",
                )}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                L{index}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="absolute bottom-5 left-0 right-0 px-6 text-center text-[0.72rem] leading-relaxed text-ivory/55">
        Architectural illustration a concept elevation of the five-level residence, not a live 3D
        model.
      </p>
    </div>
  );
}
