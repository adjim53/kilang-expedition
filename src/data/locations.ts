/**
 * Map pins and route.
 *
 * IMPORTANT: town-level coordinates (Gombe, Billiri, Kaltungo, the peak) come
 * from public gazetteers. The four VENUE pins are placed approximately inside
 * Kaltungo/Popandi and are marked `verified: false`. Before launch, drop a pin
 * on each venue in Google Maps, copy the lat/lng here and set `verified: true`
 * — the "approximate pin" warning on the site disappears automatically.
 */

export type MapLocation = {
  id: string;
  name: string;
  kind: "venue" | "town" | "airport" | "peak";
  description: string;
  position: [number, number];
  verified: boolean;
};

export const LOCATIONS: MapLocation[] = [
  {
    id: "kaleh",
    name: "Kaleh Infotech Solutions",
    kind: "venue",
    description: "Medical Checkup · Dec 30, 8:00 AM – 5:00 PM · along Mai Kaltungo Drive",
    position: [9.8162, 11.3102],
    verified: false,
  },
  {
    id: "mawato",
    name: "Mawato Hall",
    kind: "venue",
    description: "Expedition Lecture · Dec 30, 2:00 PM",
    position: [9.8128, 11.3068],
    verified: false,
  },
  {
    id: "popandi",
    name: "Catholic Primary School Popandi",
    kind: "venue",
    description: "Convergence point · Dec 31, 4:00 AM sharp",
    position: [9.7565, 11.3105],
    verified: false,
  },
  {
    id: "palace",
    name: "Palace of HRH, the Mai Kaltungo",
    kind: "venue",
    description: "Courtesy visit · Dec 31, after the descent",
    position: [9.8149, 11.3081],
    verified: false,
  },
  {
    id: "peak",
    name: "Pan Kilang (Tangale Peak)",
    kind: "peak",
    description: "The summit — highest of Gombe State's 23 mountains",
    position: [9.7333, 11.3],
    verified: true,
  },
  {
    id: "airport",
    name: "Gombe Lawanti International Airport (GMO)",
    kind: "airport",
    description: "Fly in here, then continue by road through Gombe town",
    position: [10.2983, 10.8964],
    verified: true,
  },
  {
    id: "gombe",
    name: "Gombe Town",
    kind: "town",
    description: "State capital — start of the drive south",
    position: [10.2897, 11.1673],
    verified: true,
  },
  {
    id: "billiri",
    name: "Billiri",
    kind: "town",
    description: "Midway town on the Gombe–Yola highway",
    position: [9.8647, 11.2253],
    verified: true,
  },
  {
    id: "kaltungo",
    name: "Kaltungo",
    kind: "town",
    description: "Host town of the expedition",
    position: [9.8142, 11.3089],
    verified: true,
  },
];

/** Driving line: Gombe → Kumo → Billiri → Kaltungo (simplified, not turn-by-turn). */
export const DRIVE_ROUTE: [number, number][] = [
  [10.2897, 11.1673],
  [10.196, 11.189],
  [10.0445, 11.2125], // Kumo
  [9.948, 11.214],
  [9.8647, 11.2253], // Billiri
  [9.838, 11.268],
  [9.8142, 11.3089], // Kaltungo
];

/** Airport → Gombe town connector. */
export const AIRPORT_LINK: [number, number][] = [
  [10.2983, 10.8964],
  [10.2897, 11.1673],
];

/** Kaltungo → Popandi → trailhead. */
export const TRAIL_APPROACH: [number, number][] = [
  [9.8142, 11.3089],
  [9.7565, 11.3105],
  [9.7333, 11.3],
];

/**
 * Verified pins open at their exact coordinates. Unverified venues open a
 * Google Maps search by name instead, so nobody is sent to a guessed spot.
 */
export function googleMapsLink(location: MapLocation) {
  const query = location.verified
    ? `${location.position[0]},${location.position[1]}`
    : `${location.name}, Kaltungo, Gombe State, Nigeria`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
