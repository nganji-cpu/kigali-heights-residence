import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { siteConfig } from "@/data/site";
import "./globals.css";

/**
 * A newspaper-ish serif for headlines and a clean sans for body copy. Both are
 * self-hosted by next/font, so no request leaves the deployment to render.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const description =
  "Six apartments with proper kitchens, quiet workspaces and a rooftop above Kigali, Rwanda. A design concept for a different kind of city stay.";

export const metadata: Metadata = {
  metadataBase: new URL("https://kigaliheights.example"),
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description,
  applicationName: siteConfig.name,
  keywords: [
    "Kigali",
    "Rwanda",
    "apartment residence",
    "serviced apartments",
    "design concept",
  ],
  authors: [{ name: siteConfig.name }],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description,
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f2eee6",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ivory">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
