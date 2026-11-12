import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/manrope";
import "./globals.css";
import { EVENT } from "@/data/event";
import { appUrl } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: `${EVENT.name} — Kaltungo, Gombe State`,
    template: `%s · ${EVENT.shortName}`,
  },
  description: `${EVENT.theme}. Climb Pan Kilang, the highest of Gombe State's 23 mountains, on December 31, 2026. Register, get your digital pass and plan your trip to Kaltungo.`,
  openGraph: {
    title: EVENT.name,
    description: `${EVENT.theme} — ${EVENT.tagline}.`,
    type: "website",
    locale: "en_NG",
  },
};

export const viewport: Viewport = {
  themeColor: "#134E4A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
