import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/sections/hero";
import { Legend } from "@/components/sections/legend";
import { Schedule } from "@/components/sections/schedule";
import { Gallery } from "@/components/sections/gallery";
import { Register } from "@/components/sections/register";
import { RouteMap } from "@/components/sections/route-map";
import { Packing, TravelGuide } from "@/components/sections/logistics";

// Ticket prices come from the database; refresh the page data every minute.
export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Legend />
        <Schedule />
        <Gallery />
        <Register />
        <RouteMap />
        <TravelGuide />
        <Packing />
      </main>
      <SiteFooter />
    </>
  );
}
