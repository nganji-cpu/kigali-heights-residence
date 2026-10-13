import type { Room, RoomCategory } from "@/types";

/**
 * Fictional accommodation inventory for the concept prototype.
 *
 * Prices are illustrative nightly estimates in USD and are not real tariffs.
 * To add a room, append an object here — every page reads from this single
 * source, so nothing else needs to change.
 */
export const rooms: Room[] = [
  {
    id: "rm-standard-city",
    slug: "standard-city-apartment",
    name: "Standard City Apartment",
    category: "standard",
    floor: 2,
    summary:
      "A calm, light-filled one-bedroom apartment for short business trips and city weekends.",
    description:
      "Our most understated apartment, arranged around a quiet sleeping area and a compact living space with a work-ready desk. Large windows face the Kigali skyline, and the kitchenette makes it easy to settle in for a few days without eating out twice a day.",
    pricePerNight: 120,
    capacity: 2,
    size: 42,
    bedType: "1 queen bed",
    view: "City outlook",
    amenities: [
      "High-speed Wi-Fi",
      "Air conditioning",
      "Kitchenette",
      "Work desk",
      "Smart TV",
      "In-room safe",
      "Rain shower",
      "Daily housekeeping",
    ],
    images: [
      "/images/room-standard.jpg",
      "/images/kitchen-apartment.jpg",
      "/images/corridor-hotel.jpg",
      "/images/living-sea-ranch.jpg",
    ],
    featured: false,
  },
  {
    id: "rm-standard-garden",
    slug: "garden-standard-apartment",
    name: "Garden Standard Apartment",
    category: "standard",
    floor: 2,
    summary:
      "A twin-ready apartment on the quieter side of level two, with softer natural light.",
    description:
      "Designed for colleagues travelling together or friends sharing a stay, this apartment can be arranged with twin beds. The shaded side of the building keeps afternoons cooler, and the compact lounge doubles as a comfortable place to work or read.",
    pricePerNight: 135,
    capacity: 2,
    size: 45,
    bedType: "1 queen bed or twin beds",
    view: "Internal courtyard",
    amenities: [
      "High-speed Wi-Fi",
      "Air conditioning",
      "Kitchenette",
      "Twin-bed option",
      "Smart TV",
      "Blackout curtains",
      "Rain shower",
      "Daily housekeeping",
    ],
    images: [
      "/images/room-standard-2.jpg",
      "/images/living-sea-ranch.jpg",
      "/images/kitchen-apartment.jpg",
      "/images/corridor-hotel.jpg",
    ],
    featured: false,
  },
  {
    id: "rm-deluxe-apartment",
    slug: "deluxe-apartment",
    name: "Deluxe Apartment",
    category: "deluxe",
    floor: 3,
    summary:
      "More living space, warmer finishes and a proper dining corner for longer stays.",
    description:
      "The Deluxe Apartment opens into a generous living and dining area separated from the bedroom, which makes it well suited to stays of a week or more. Textured stone, warm timber and layered lighting give the apartment a settled, residential feel rather than a hotel-room one.",
    pricePerNight: 185,
    capacity: 3,
    size: 58,
    bedType: "1 king bed + sofa bed",
    view: "City and hills",
    amenities: [
      "High-speed Wi-Fi",
      "Air conditioning",
      "Full kitchen",
      "Dining for four",
      "Washer & dryer",
      "Espresso machine",
      "Private balcony",
      "Daily housekeeping",
    ],
    images: [
      "/images/room-deluxe.jpg",
      "/images/lounge-modern.jpg",
      "/images/kitchen-apartment.jpg",
      "/images/bathroom-suite.jpg",
    ],
    featured: true,
  },
  {
    id: "rm-deluxe-corner",
    slug: "deluxe-corner-apartment",
    name: "Deluxe Corner Apartment",
    category: "deluxe",
    floor: 3,
    summary:
      "A corner apartment with windows on two sides and a deep, shaded balcony.",
    description:
      "Corner positioning gives this Deluxe apartment twice the daylight and a long balcony that catches the late afternoon. Inside, a deep sofa, a separate dining table and a generous bathroom with a freestanding tub make it a comfortable base for couples or small families.",
    pricePerNight: 210,
    capacity: 4,
    size: 64,
    bedType: "1 king bed + 2 singles",
    view: "Panoramic corner balcony",
    amenities: [
      "High-speed Wi-Fi",
      "Air conditioning",
      "Full kitchen",
      "Freestanding bath",
      "Washer & dryer",
      "Corner balcony",
      "Workspace",
      "Daily housekeeping",
    ],
    images: [
      "/images/room-deluxe-corner.jpg",
      "/images/dining-table.jpg",
      "/images/bathroom-suite.jpg",
      "/images/lounge-modern.jpg",
    ],
    featured: false,
  },
  {
    id: "rm-executive-suite",
    slug: "executive-suite",
    name: "Executive Suite",
    category: "executive",
    floor: 4,
    summary:
      "Built for business travel: a quiet study, fast connectivity and a separated lounge.",
    description:
      "The Executive Suite is arranged so that work and rest stay apart a dedicated study with a full-width desk, a separate lounge for informal meetings, and blackout-lined sleeping quarters. Concierge support for printing, transfers and conference logistics is available on request.",
    pricePerNight: 260,
    capacity: 2,
    size: 72,
    bedType: "1 king bed",
    view: "Kigali skyline",
    amenities: [
      "Dedicated study",
      "Wired & wireless internet",
      "Air conditioning",
      "Meeting-ready lounge",
      "Nespresso machine",
      "Pressing service",
      "Blackout bedroom",
      "Daily housekeeping",
    ],
    images: [
      "/images/room-executive.jpg",
      "/images/living-sea-ranch.jpg",
      "/images/dining-table.jpg",
      "/images/bathroom-suite.jpg",
    ],
    featured: true,
  },
  {
    id: "rm-penthouse-residence",
    slug: "penthouse-residence",
    name: "Penthouse Residence",
    category: "penthouse",
    floor: 5,
    summary:
      "The top floor, opening onto the rooftop lounge with long views across the city.",
    description:
      "The Penthouse occupies the quietest corner of level five and connects directly to the rooftop lounge. Two bedrooms, a full entertaining kitchen, a library corner and a private terrace make it the natural choice for family stays, small celebrations, or long executive visits where guests want room to host.",
    pricePerNight: 480,
    capacity: 4,
    size: 145,
    bedType: "2 king beds + 2 sofa beds",
    view: "Rooftop, city and hills",
    amenities: [
      "Direct rooftop access",
      "Private terrace",
      "Full entertaining kitchen",
      "Library corner",
      "Two bathrooms",
      "Dedicated concierge",
      "Nespresso machine",
      "Daily housekeeping",
    ],
    images: [
      "/images/room-penthouse.jpg",
      "/images/penthouse-pool.jpg",
      "/images/rooftop-bar-night.jpg",
      "/images/library-amantaka.jpg",
      "/images/bathroom-suite.jpg",
    ],
    featured: true,
  },
];

export interface CategoryMeta {
  value: RoomCategory | "all";
  label: string;
  blurb: string;
}

export const roomCategories: CategoryMeta[] = [
  {
    value: "all",
    label: "All accommodation",
    blurb: "Every apartment and suite in the concept residence.",
  },
  {
    value: "standard",
    label: "Standard",
    blurb: "Level 2 · efficient apartments for short stays.",
  },
  {
    value: "deluxe",
    label: "Deluxe",
    blurb: "Level 3 · more living space and warmer finishes.",
  },
  {
    value: "executive",
    label: "Executive",
    blurb: "Level 4 · quiet, work-ready suites for longer visits.",
  },
  {
    value: "penthouse",
    label: "Penthouse",
    blurb: "Level 5 · rooftop living with panoramic views.",
  },
];

export const categoryLabels: Record<RoomCategory, string> = {
  standard: "Standard",
  deluxe: "Deluxe",
  executive: "Executive",
  penthouse: "Penthouse",
};

export function isRoomCategory(value: string | null | undefined): value is RoomCategory {
  if (!value) return false;
  return ["standard", "deluxe", "executive", "penthouse"].includes(value);
}

export function getRoomBySlug(slug: string): Room | undefined {
  return rooms.find((room) => room.slug === slug);
}

export function getAllRoomSlugs(): string[] {
  return rooms.map((room) => room.slug);
}

export function getFeaturedRooms(limit = 3): Room[] {
  return rooms.filter((room) => room.featured).slice(0, limit);
}

export function getRoomsByCategory(category: RoomCategory | "all"): Room[] {
  if (category === "all") return rooms;
  return rooms.filter((room) => room.category === category);
}

export function getRoomsOnLevel(level: number): Room[] {
  return rooms.filter((room) => room.floor === level);
}

/**
 * Suggests up to `limit` other apartments, preferring the same category and
 * then the same level, so the suggestion list always stays relevant.
 */
export function getRelatedRooms(slug: string, limit = 3): Room[] {
  const current = getRoomBySlug(slug);
  if (!current) return rooms.slice(0, limit);

  const scored = rooms
    .filter((room) => room.slug !== slug)
    .map((room) => {
      let score = 0;
      if (room.category === current.category) score += 3;
      if (room.floor === current.floor) score += 2;
      if (Math.abs(room.floor - current.floor) === 1) score += 1;
      return { room, score };
    })
    .sort((a, b) => b.score - a.score || a.room.pricePerNight - b.room.pricePerNight);

  return scored.slice(0, limit).map((entry) => entry.room);
}

export const lowestRate = Math.min(...rooms.map((room) => room.pricePerNight));
