import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/sections/hero";
import { Legend } from "@/components/sections/legend";
import { Schedule } from "@/components/sections/schedule";
import { Gallery } from "@/components/sections/gallery";
import { Register } from "@/components/sections/register";
import { Donate } from "@/components/sections/donate";
import { RouteMap } from "@/components/sections/route-map";
import { Packing, TravelGuide } from "@/components/sections/logistics";

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
        <Donate />
        <RouteMap />
        <TravelGuide />
        <Packing />
      </main>
      <SiteFooter />
    </>
  );
}
