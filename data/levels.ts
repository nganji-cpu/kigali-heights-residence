import type { LevelNumber, ResidenceLevel } from "@/types";

/**
 * Narrative description of the five-level concept residence.
 *
 * The Explore page reads from here, and the room data references the same
 * level numbers, so the building story stays consistent across the site.
 */
export const residenceLevels: ResidenceLevel[] = [
  {
    level: 1,
    name: "Arrival & Reception",
    tagline: "Lobby, reception desk, guest lounge and concierge",
    description:
      "Guests arrive into a double-height lobby with a concierge desk, a small library lounge and a coffee bar. It is designed as a place to pause for a briefing before a meeting, a quiet call, or a first Rwandan coffee after a long flight.",
    facilities: [
      "Reception & concierge desk",
      "Guest lounge and library",
      "Coffee bar",
      "Luggage room",
      "Accessible step-free entrance",
    ],
    image: "/images/lobby-entrance-dusk.jpg",
    imageAlt: "Warmly lit arrival lobby with lounge seating at dusk",
    category: null,
  },
  {
    level: 2,
    name: "Standard Apartments",
    tagline: "Efficient one-bedroom apartments for shorter stays",
    description:
      "Level two holds the most compact apartments in the residence. Each is planned around a calm sleeping zone, a compact kitchenette and a desk, which suits guests who are in Kigali for a conference or a short assignment and want an easy, private base.",
    facilities: [
      "Two standard apartment layouts",
      "Kitchenette and work desk",
      "Laundry access on the floor",
      "Shared reading alcove",
      "Lifts and a walkable stair",
    ],
    image: "/images/kitchen-apartment.jpg",
    imageAlt: "Bright apartment kitchen and dining corner with simple modern decor",
    category: "standard",
  },
  {
    level: 3,
    name: "Deluxe Apartments",
    tagline: "More living space, separate dining and refined finishes",
    description:
      "Level three steps up in space and material. Apartments here separate living from sleeping, add a real dining table and a full kitchen, and open onto balconies the level most guests choose for stays of a week or longer.",
    facilities: [
      "Separate living and dining areas",
      "Full kitchens",
      "Private and corner balconies",
      "Washer and dryer in apartment",
      "Housekeeping on request",
    ],
    image: "/images/lounge-modern.jpg",
    imageAlt: "Contemporary lounge with layered lighting and a stone feature wall",
    category: "deluxe",
  },
  {
    level: 4,
    name: "Executive Suites",
    tagline: "Quiet, work-ready suites for business travel and longer stays",
    description:
      "Level four is the working floor. Suites pair a dedicated study with a lounge that can host a small meeting, backed by wired internet, printing support and a concierge who can arrange transfers and conference logistics.",
    facilities: [
      "Dedicated study in every suite",
      "Meeting-ready lounge",
      "Business and printing support",
      "Pressing and garment care",
      "Priority airport transfers",
    ],
    image: "/images/room-deluxe-corner.jpg",
    imageAlt: "Refined corner apartment bedroom with soft daylight",
    category: "executive",
  },
  {
    level: 5,
    name: "Penthouse & Rooftop",
    tagline: "Top-floor residence, rooftop lounge and long city views",
    description:
      "The top level is given over to a single penthouse residence and a rooftop lounge with an open terrace, a small plunge pool and seating arranged for the light. It is where the residence feels most like a place to gather, with Kigali's hills as the backdrop.",
    facilities: [
      "Penthouse residence with terrace",
      "Rooftop lounge and open terrace",
      "Sunset seating and fire table",
      "Small plunge pool concept",
      "Private dining on request",
    ],
    image: "/images/rooftop-bar-night.jpg",
    imageAlt: "Rooftop lounge glowing at night above a city skyline",
    category: "penthouse",
  },
];

export function getLevel(level: number): ResidenceLevel {
  return (
    residenceLevels.find((entry) => entry.level === level) ?? residenceLevels[0]
  );
}

export function isLevelNumber(value: number): value is LevelNumber {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}
