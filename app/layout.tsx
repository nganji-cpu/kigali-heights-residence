import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { siteConfig } from "@/data/site";
import "./globals.css";

/**
 * Editorial serif for headlines and a clean sans for body copy. Both are
 * self-hosted by next/font, so no request leaves the deployment to render.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const description =
  "Kigali Heights Residence is a fictional five-level apartment residence concept for Kigali, Rwanda a design study of apartment hospitality for business travellers and longer stays.";

export const metadata: Metadata = {
  metadataBase: new URL("https://kigaliheights.example"),
  title: {
    default: `${siteConfig.name} — ${siteConfig.conceptLabel}`,
    template: `%s · ${siteConfig.name}`,
  },
  description,
  applicationName: siteConfig.name,
  keywords: [
    "Kigali",
    "Rwanda",
    "apartment residence",
    "concept prototype",
    "hospitality design study",
  ],
  authors: [{ name: `${siteConfig.name} (concept)` }],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.conceptLabel}`,
    description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.conceptLabel}`,
    description,
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f7f4ee",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ivory">
        <AnnouncementBar />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
