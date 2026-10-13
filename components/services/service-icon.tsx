import {
  CalendarClock,
  Car,
  CarFront,
  Compass,
  Map,
  Plane,
  Presentation,
  Shirt,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps the string icon names used in `data/services.ts` to Lucide components.
 * Unknown names fall back to a compass so the UI never renders an empty slot.
 */
const iconRegistry: Record<string, LucideIcon> = {
  Plane,
  Car,
  CarFront,
  Map,
  Shirt,
  UtensilsCrossed,
  Presentation,
  CalendarClock,
  Compass,
};

export function resolveServiceIcon(name: string): LucideIcon {
  return iconRegistry[name] ?? Compass;
}

interface ServiceIconProps {
  /** Icon name declared in `data/services.ts`. */
  name: string;
  className?: string;
}

/**
 * Renders the Lucide glyph for a service. Kept as a component (rather than
 * resolving the icon into a local inside the card) so no component is created
 * during render.
 */
export function ServiceIcon({ name, className }: ServiceIconProps) {
  const Icon = iconRegistry[name] ?? Compass;
  return <Icon aria-hidden="true" className={className} />;
}
