import type { ExperienceSection } from "@/types";

/**
 * Editorial content for the /discover destination page.
 *
 * Descriptions are general impressions of visiting Rwanda. No partnerships,
 * businesses or specific venues are implied.
 */
export const experienceSections: ExperienceSection[] = [
  {
    id: "city",
    eyebrow: "The city",
    title: "A capital that unfolds across hills",
    description:
      "Kigali is unusually easy to move through for a city of its size, and unusually green. Districts sit at different heights, so a ten-minute drive can change the whole view from the dense energy of Nyabugogo to the quiet residential streets of Kacyiru and Nyarutarama. Mornings are best spent on foot; afternoons are for the long, wide views.",
    quote:
      "Guests often say the first surprise is how calm it feels, and the second is how quickly they want to stay longer.",
    images: [
      { src: "/images/kigali-hills.jpg", alt: "Green hills of Kigali seen from a viewpoint" },
      { src: "/images/kigali-city-street.jpg", alt: "Elevated view over a Kigali city street" },
      { src: "/images/kigali-night.jpg", alt: "Kigali spread out and lit at night" },
    ],
  },
  {
    id: "culture",
    eyebrow: "Art & culture",
    title: "Studios, craft and a city that makes things",
    description:
      "Kigali's creative scene has grown quickly around a handful of studios, galleries and independent workshops. Ceramics, textiles, painting and design pieces are made within the city and can often be bought directly from the people who made them. For guests with an afternoon free, a slow visit to one or two studios is worth more than a rushed circuit.",
    images: [
      { src: "/images/service-tour.jpg", alt: "Courtyard of a Kigali arts centre with murals" },
      { src: "/images/rwanda-dance.jpg", alt: "Traditional Rwandan dance performance" },
      { src: "/images/kigali-market.jpg", alt: "Market stalls in Kigali" },
    ],
  },
  {
    id: "dining",
    eyebrow: "Food & dining",
    title: "From market produce to a long evening table",
    description:
      "Rwandan cooking is generous and seasonal: beans, plantain, cassava, tilapia from Lake Kivu, and coffee grown a few hours away. Contemporary kitchens in the city reinterpret those ingredients, and there is a strong café culture for the hours between meetings. Ask the concierge for the dishes best suited to your evening.",
    quote:
      "Brochettes, seasonal vegetables and a single-origin Rwandan coffee are a fair introduction to the country.",
    images: [
      { src: "/images/restaurant-interior.jpg", alt: "Warm restaurant interior set for dinner" },
      { src: "/images/coffee-shop.jpg", alt: "Coffee shop interior with counter seating" },
      { src: "/images/rwanda-coffee.jpg", alt: "A cup of Rwandan coffee served with cream" },
    ],
  },
  {
    id: "nature",
    eyebrow: "Nature & escapes",
    title: "Volcanoes, lake shores and a weekend outside the city",
    description:
      "Rwanda is compact, which makes the countryside genuinely reachable. Musanze and the Volcanoes are a two-hour drive from the city, Lake Kivu rather more. Both work as one- or two-night escapes between longer stretches of work, and both are comfortable to arrange with a car and driver.",
    images: [
      { src: "/images/rwanda-gorilla.jpg", alt: "Mountain gorilla resting in forest vegetation" },
      { src: "/images/lake-kivu.jpg", alt: "Quiet shoreline of Lake Kivu at dawn" },
      { src: "/images/rwanda-hills.jpg", alt: "Cultivated hills stretching across the Rwandan landscape" },
    ],
  },
  {
    id: "business",
    eyebrow: "Business travel",
    title: "A working city with a growing calendar",
    description:
      "Kigali hosts a steady rhythm of conferences, summits and regional meetings, and the convention district sits close to the main hotel and business corridors. Guests staying for work tend to value the quiet of a residential building, reliable connectivity, and a driver who knows the morning traffic patterns.",
    quote:
      "Most guests arrive for three days and add a weekend once they see how much is within reach.",
    images: [
      { src: "/images/service-conference.jpg", alt: "Minimalist meeting room with a long table" },
      { src: "/images/kigali-convention-centre.jpg", alt: "Kigali Convention Centre and surrounding city" },
      { src: "/images/office-glass-facade.jpg", alt: "Contemporary glass office facade" },
    ],
  },
];

/** Quick reference facts shown alongside the destination story. */
export const destinationFacts = [
  { label: "City", value: "Kigali, Rwanda" },
  { label: "Language", value: "Kinyarwanda · English · French" },
  { label: "Currency", value: "Rwandan franc (RWF)" },
  { label: "Airport", value: "Kigali International (KGL)" },
  { label: "Best months", value: "June–September · December–February" },
  { label: "Beyond the city", value: "Volcanoes · Lake Kivu · Nyungwe" },
];
