import type { Service, ServiceCategory, PricingType } from "@/types";

/**
 * Optional guest services for the concept prototype.
 *
 * Every price is an illustrative estimate used to demonstrate the booking
 * flow. Nothing here represents a real service that is currently provided.
 */
export const services: Service[] = [
  {
    id: "svc-airport-pickup",
    slug: "airport-pickup",
    name: "Airport Pickup",
    category: "transport",
    summary: "A driver waiting in arrivals at Kigali International Airport.",
    description:
      "Share your flight details and a driver meets you in the arrivals hall with a name board, then brings you directly to the residence. Flight tracking is assumed so late arrivals are covered.",
    samplePrice: 35,
    pricingType: "per-trip",
    priceNote: "Illustrative estimate, one way",
    icon: "Plane",
    image: "/images/service-airport.jpg",
  },
  {
    id: "svc-private-driver",
    slug: "private-driver",
    name: "Private Driver",
    category: "transport",
    summary: "A car and driver on standby for the length of your stay.",
    description:
      "For guests with back-to-back meetings, a driver can be assigned for the day or the full stay, with a comfortable sedan and a schedule agreed the evening before.",
    samplePrice: 120,
    pricingType: "per-day",
    priceNote: "Illustrative estimate, per day",
    icon: "CarFront",
    image: "/images/service-driver.jpg",
  },
  {
    id: "svc-car-rental",
    slug: "car-rental",
    name: "Car Rental",
    category: "transport",
    summary: "A self-drive SUV for weekend trips beyond the city.",
    description:
      "Ideal for guests planning a weekend towards Musanze or Lake Kivu. Vehicles are arranged with a local rental partner, with insurance and roadside support discussed at handover.",
    samplePrice: 75,
    pricingType: "per-day",
    priceNote: "Illustrative estimate, per day",
    icon: "Car",
    image: "/images/service-car-rental.jpg",
  },
  {
    id: "svc-city-tours",
    slug: "kigali-city-tours",
    name: "Kigali City Tours",
    category: "lifestyle",
    summary: "Half-day introductions to Kigali's art, markets and history.",
    description:
      "A guided half day covering the city's creative studios, a market walk and one of the memorial sites, paced so it works as a first or second day in Rwanda.",
    samplePrice: 60,
    pricingType: "per-person",
    priceNote: "Illustrative estimate, per person",
    icon: "Map",
    image: "/images/service-tour.jpg",
  },
  {
    id: "svc-laundry",
    slug: "laundry-service",
    name: "Laundry & Pressing",
    category: "lifestyle",
    summary: "Same-day laundry, pressing and garment care.",
    description:
      "Bags collected in the morning are returned folded or on hangers the same evening. Useful for guests arriving from a long trip or heading straight into meetings.",
    samplePrice: 20,
    pricingType: "per-booking",
    priceNote: "Illustrative estimate, per collection",
    icon: "Shirt",
    image: "/images/service-laundry.jpg",
  },
  {
    id: "svc-dining",
    slug: "in-residence-dining",
    name: "In-Residence Dining",
    category: "dining",
    summary: "A private chef or a delivered menu, served in your apartment.",
    description:
      "Choose a set menu cooked in your kitchen by a visiting chef, or a prepared meal delivered and plated for a quiet evening in. Dietary requirements are agreed in advance.",
    samplePrice: 45,
    pricingType: "per-person",
    priceNote: "Illustrative estimate, per person",
    icon: "UtensilsCrossed",
    image: "/images/dining-table.jpg",
  },
  {
    id: "svc-conference",
    slug: "conference-support",
    name: "Conference & Event Support",
    category: "business",
    summary: "Room set-up, printing and coordination for delegations.",
    description:
      "For guests in Kigali for a summit or delegation, we can prepare a meeting lounge, arrange printing and couriers, and coordinate group transfers on a shared schedule.",
    samplePrice: 150,
    pricingType: "per-day",
    priceNote: "Illustrative estimate, per day",
    icon: "Presentation",
    image: "/images/service-conference.jpg",
  },
  {
    id: "svc-extended-stay",
    slug: "extended-stay",
    name: "Extended-Stay Support",
    category: "business",
    summary: "A monthly rhythm of housekeeping, restocking and errands.",
    description:
      "Designed for relocating professionals and long assignments: a scheduled housekeeping rhythm, grocery restocking, and a single point of contact for the small logistics of living in Kigali.",
    samplePrice: 90,
    pricingType: "per-booking",
    priceNote: "Illustrative estimate, per week",
    icon: "CalendarClock",
    image: "/images/service-extended-stay.jpg",
  },
];

export const serviceCategoryLabels: Record<ServiceCategory, string> = {
  transport: "Transport",
  dining: "Dining",
  lifestyle: "Lifestyle",
  business: "Business",
};

export const pricingTypeLabels: Record<PricingType, string> = {
  "per-trip": "per trip",
  "per-day": "per day",
  "per-person": "per person",
  "per-person-day": "per person / day",
  "per-booking": "per booking",
};

export const serviceSlugs = services.map((service) => service.slug);

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export function getServicesBySlugs(slugs: string[]): Service[] {
  return services.filter((service) => slugs.includes(service.slug));
}
