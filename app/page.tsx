import { ArchitectureShowcase } from "@/components/home/architecture-showcase";
import { DestinationFeature } from "@/components/home/destination-feature";
import { ExplorePreview } from "@/components/home/explore-preview";
import { FeaturedRooms } from "@/components/home/featured-rooms";
import { Hero } from "@/components/home/hero";
import { IntroSection } from "@/components/home/intro-section";
import { ReservationCta } from "@/components/home/reservation-cta";
import { RooftopFeature } from "@/components/home/rooftop-feature";
import { ServicesPreview } from "@/components/home/services-preview";

export default function HomePage() {
  return (
    <>
      <Hero />
      <IntroSection />
      <FeaturedRooms />
      <ArchitectureShowcase />
      <ExplorePreview />
      <ServicesPreview />
      <RooftopFeature />
      <DestinationFeature />
      <ReservationCta />
    </>
  );
}
