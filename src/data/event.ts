/**
 * Single source of truth for event facts. Edit here and the whole site updates.
 */

export const EVENT = {
  name: "Kilang Mountain Expedition 2026",
  shortName: "Kilang Expedition 2026",
  theme: "Adventure for Recreation, Unity & Peace Building",
  tagline: "Explore the natural beauty of Kilang Mountain, Kaltungo",
  location: "Kaltungo, Gombe State, Nigeria",
  /** Countdown target: medical checkup opens, 30 Dec 2026, 8:00 AM WAT (UTC+1). */
  startsAt: "2026-12-30T08:00:00+01:00",
  /** Ascent: 31 Dec 2026, 4:00 AM WAT. */
  ascentAt: "2026-12-31T04:00:00+01:00",
  year: 2026,
} as const;

export const CONTACT = {
  email: "kilangexp@gmail.com",
  phones: ["08031907825", "08136571113", "08027367193"],
  handle: "@KilangExpedition",
  socials: [
    { name: "X", url: "https://x.com/KilangExpedition" },
    { name: "Instagram", url: "https://instagram.com/KilangExpedition" },
    { name: "TikTok", url: "https://www.tiktok.com/@KilangExpedition" },
    { name: "Facebook", url: "https://facebook.com/KilangExpedition" },
    { name: "YouTube", url: "https://youtube.com/@KilangExpedition" },
  ],
} as const;

export type ScheduleItem = {
  id: string;
  day: "Dec 30" | "Dec 31";
  date: string;
  time: string;
  title: string;
  venue: string;
  note: string;
  audience: string;
  locationId: string;
};

export const SCHEDULE: ScheduleItem[] = [
  {
    id: "medical",
    day: "Dec 30",
    date: "Wednesday, December 30, 2026",
    time: "8:00 AM – 5:00 PM",
    title: "Mandatory Medical Checkup",
    venue: "Kaleh Infotech Solutions Premises, along Mai Kaltungo Drive",
    note: "Ensure you are medically fit. Stay safe.",
    audience: "All registered climbers — bring your digital pass",
    locationId: "kaleh",
  },
  {
    id: "lecture",
    day: "Dec 30",
    date: "Wednesday, December 30, 2026",
    time: "2:00 PM",
    title: "Expedition Lecture",
    venue: "Mawato Hall",
    note: "Participants must attend. The general public is invited.",
    audience: "Climbers (required) · General public (welcome)",
    locationId: "mawato",
  },
  {
    id: "ascent",
    day: "Dec 31",
    date: "Thursday, December 31, 2026",
    time: "4:00 AM sharp",
    title: "Expedition D-Day — Converging & Ascent",
    venue: "Catholic Primary School Popandi, Kaltungo",
    note: "Muster in the dark, climb into the sunrise. Headlamps on, bibs visible.",
    audience: "Medically cleared climbers only",
    locationId: "popandi",
  },
  {
    id: "palace",
    day: "Dec 31",
    date: "Thursday, December 31, 2026",
    time: "After the descent",
    title: "Expedition Courtesy Visit",
    venue: "Palace of His Royal Highness, the Mai Kaltungo",
    note: "The expedition closes with a royal audience at the palace.",
    audience: "All climbers",
    locationId: "palace",
  },
];
