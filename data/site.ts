/**
 * Brand + navigation configuration.
 *
 * The brand name is provisional: change `name` here and it propagates through
 * the header, footer, metadata and page copy that references `siteConfig`.
 */

/**
 * Copyright year, pinned to a constant rather than `new Date()`.
 *
 * With Cache Components enabled, calling `new Date()` while prerendering the
 * static shell is treated as synchronous IO and fails the build, so the year is
 * declared here instead. Update it when the concept is revised.
 */
export const copyrightYear = 2026;

export const siteConfig = {
  name: "Kigali Heights Residence",
  shortName: "Kigali Heights",
  monogram: "KH",
  /** Provisional brand line — intentionally not a registered trading name. */
  tagline: "Apartment hospitality in the hills of Kigali",
  conceptLabel: "Concept prototype",
  conceptNotice:
    "Kigali Heights Residence is a fictional concept for a design study. It is not a real operating property and nothing here represents real availability, verified pricing, or a completed booking.",
  location: {
    city: "Kigali",
    country: "Rwanda",
    district: "Kacyiru (illustrative location)",
    addressLine: "Concept address — not a real premises",
  },
  contact: {
    /** Demo-only contact details. */
    phone: "+250 788 123 456",
    phoneNote: "Demo number",
    email: "hello@kigaliheights.example",
    emailNote: "Demo address",
    hours: "Concept concierge desk 24 hours",
  },
  social: [
    { label: "Instagram", href: "https://instagram.com", handle: "@kigaliheightsresidence" },
    { label: "LinkedIn", href: "https://linkedin.com", handle: "Kigali Heights Residence" },
    { label: "X", href: "https://x.com", handle: "@kigaliheights" },
  ],
} as const;

export interface NavItem {
  href: string;
  label: string;
  description: string;
}

export const primaryNav: NavItem[] = [
  { href: "/rooms", label: "Accommodation", description: "Six apartment and suite concepts across five levels" },
  { href: "/explore", label: "Explore", description: "An interactive walkthrough of the five-level residence" },
  { href: "/services", label: "Guest Services", description: "Transport, dining, laundry and business support" },
  { href: "/discover", label: "Kigali", description: "City, culture and scenic experiences" },
  { href: "/about", label: "About", description: "The concept, philosophy and architectural vision" },
  { href: "/contact", label: "Contact", description: "Ask a question or request the concept deck" },
];

export const footerNav: { title: string; items: { href: string; label: string }[] }[] = [
  {
    title: "Stay",
    items: [
      { href: "/rooms", label: "Apartments & suites" },
      { href: "/rooms?category=penthouse", label: "Penthouse residence" },
      { href: "/explore", label: "Explore the residence" },
      { href: "/book", label: "Reserve your stay" },
    ],
  },
  {
    title: "Experience",
    items: [
      { href: "/services", label: "Guest services" },
      { href: "/discover", label: "Kigali experiences" },
      { href: "/discover#dining", label: "Food & dining" },
      { href: "/discover#business", label: "Business travel" },
    ],
  },
  {
    title: "Concept",
    items: [
      { href: "/about", label: "About the project" },
      { href: "/about#architecture", label: "Architecture" },
      { href: "/contact", label: "Contact" },
      { href: "/credits", label: "Image credits" },
    ],
  },
];

export const announcement = {
  text: "A five-level apartment residence concept for Kigali, Rwanda",
  link: { href: "/explore", label: "Explore the residence" },
} as const;
