import { Suspense } from "react";
import { AmenitiesFallback, AmenitiesSection } from "@/components/home/amenities-section";
import { ExploreCta } from "@/components/home/explore-cta";
import { FeaturedRooms, FeaturedRoomsFallback } from "@/components/home/featured-rooms";
import { Hero } from "@/components/home/hero";
import { IntroSection } from "@/components/home/intro-section";

export default function HomePage() {
  return (
    <>
      <Hero />
      <IntroSection />
      <Suspense fallback={<FeaturedRoomsFallback />}>
        <FeaturedRooms />
      </Suspense>
      <Suspense fallback={<AmenitiesFallback />}>
        <AmenitiesSection />
      </Suspense>
      <ExploreCta />
    </>
  );
}
