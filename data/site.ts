/**
 * Brand and navigation configuration.
 *
 * Change `name` here to rebrand the site across the header, footer, metadata
 * and any page that references `siteConfig`.
 */

/**
 * Copyright year, pinned to a constant rather than `new Date()`.
 *
 * With Cache Components enabled, calling `new Date()` while prerendering the
 * static shell is treated as synchronous IO and fails the build, so the year is
 * declared here instead.
 */
export const copyrightYear = 2026;

export const siteConfig = {
  name: "Kigali Heights Residence",
  shortName: "Kigali Heights",
  monogram: "KH",
  tagline: "Apartment hospitality in the hills of Kigali",
  conceptNotice:
    "Kigali Heights Residence is a design concept, not an operating property. The property, apartments, amenities, services, rates and availability are illustrative. Reservations do not hold a real apartment and no payment is taken.",
  location: {
    city: "Kigali",
    country: "Rwanda",
  },
} as const;

export interface NavItem {
  href: string;
  label: string;
  description: string;
}

export const primaryNav: NavItem[] = [
  {
    href: "/rooms",
    label: "Apartments",
    description: "Six apartments and suites across four guest floors",
  },
  {
    href: "/about",
    label: "Residence",
    description: "The idea, the architecture and the way the building works",
  },
  {
    href: "/explore",
    label: "Explore",
    description: "Move through the five levels, from lobby to rooftop",
  },
  {
    href: "/services",
    label: "Services",
    description: "Transfers, private dining, laundry and business support",
  },
  {
    href: "/contact",
    label: "Contact",
    description: "Ask about dates, a longer stay or anything else",
  },
];

export const footerNav: { title: string; items: { href: string; label: string }[] }[] = [
  {
    title: "Stay",
    items: [
      { href: "/rooms", label: "Apartments & suites" },
      { href: "/book", label: "Reserve a stay" },
      { href: "/services", label: "Guest services" },
      { href: "/explore", label: "Explore the residence" },
    ],
  },
  {
    title: "The residence",
    items: [
      { href: "/about", label: "About" },
      { href: "/about#architecture", label: "Architecture" },
      { href: "/discover", label: "Kigali & Rwanda" },
      { href: "/contact", label: "Contact" },
    ],
  },
];
