/**
 * Editorial content: the legend, packing list, travel guide and gallery.
 *
 * The legend copy is written from the organisers' brief. Please have it read
 * by Tangale elders / the palace before launch and correct anything here.
 */

export type LegendChapter = {
  id: string;
  label: string;
  title: string;
  body: string[];
  fact: { value: string; caption: string };
};

export const LEGEND: LegendChapter[] = [
  {
    id: "mountain",
    label: "The Mountain",
    title: "The roof of Gombe",
    body: [
      "Pan Kilang — Tangale Peak, Kilang Hill — rises over Popandi village in Kaltungo. Of the twenty-three mountains of Gombe State, none stands higher.",
      "Its cone lifts roughly a thousand feet clear of the savannah plateau, a landmark visible long before the road reaches town. From the summit the land of the Tangale opens out in every direction.",
    ],
    fact: { value: "1 of 23", caption: "the highest of Gombe State's mountains" },
  },
  {
    id: "sanctuary",
    label: "The Sanctuary",
    title: "Stone that sheltered a people",
    body: [
      "The hills around Kilang are volcanic inselbergs — islands of old rock left standing as the plains wore away around them.",
      "For the Tangale they were more than scenery. In times of danger the heights were defensive sanctuaries, and their summits were held as spiritual bastions where the community kept faith with those who came before.",
    ],
    fact: { value: "Inselberg", caption: "“island mountain” — volcanic rock above the plain" },
  },
  {
    id: "kunlung",
    label: "The Kunlung",
    title: "The serpent that keeps watch",
    body: [
      "Tangale tradition speaks of Kunlung, the ancestral snake totem bound to the mountain and to the people who live beneath it.",
      "The serpent is remembered as a guardian and a sign of kinship: a reminder that the mountain is not empty ground, and that those who climb it do so as guests of the ancestors.",
    ],
    fact: { value: "Kunlung", caption: "the ancestral snake totem of Tangale lore" },
  },
  {
    id: "ascent",
    label: "The Ascent",
    title: "One climb, one people",
    body: [
      "Each year the community returns to the mountain. The ascent is a homecoming — a way of walking back into history together and coming down as neighbours.",
      "The Kilang Expedition carries that tradition forward: recreation, unity and peace building, on a trail climbed shoulder to shoulder from a 4:00 AM start into first light.",
    ],
    fact: { value: "4:00 AM", caption: "the muster at Popandi, December 31" },
  },
];

export const PACKING_LIST: { group: string; items: string[] }[] = [
  {
    group: "Essentials for the 4:00 AM start",
    items: [
      "Headlamp or flashlight with fresh batteries (you start in darkness)",
      "Your digital expedition pass (QR code) — on your phone and printed",
      "Climber bib, worn where marshals can see it",
      "Fully charged phone",
    ],
  },
  {
    group: "On your feet and back",
    items: [
      "Trail boots or sturdy closed shoes with good grip",
      "Hydration pack or at least 2 litres of water",
      "Light daypack",
      "Warm layer — harmattan mornings are cold before sunrise",
      "Hat and sunscreen for the descent",
    ],
  },
  {
    group: "Fuel and first aid",
    items: [
      "High-energy snacks (dates, groundnuts, glucose biscuits)",
      "Oral rehydration salts",
      "Any personal medication, including an inhaler if you use one",
      "Small first-aid kit: plasters, antiseptic wipes, blister care",
    ],
  },
  {
    group: "Good to have",
    items: [
      "Dust mask or buff for harmattan haze",
      "Trekking pole",
      "Power bank",
      "A small bag for your litter — leave nothing on the mountain",
    ],
  },
];

export const TRAVEL_GUIDE = [
  {
    id: "fly",
    title: "Flying in",
    summary: "Gombe Lawanti International Airport (GMO)",
    points: [
      "GMO is the nearest airport, west of Gombe town on the Bauchi road.",
      "From the airport, drive into Gombe town and continue south towards Kaltungo.",
      "Book your airport pickup before you fly — arrange transport through the organisers if you need help.",
    ],
  },
  {
    id: "drive",
    title: "Driving down",
    summary: "Gombe → Kumo → Billiri → Kaltungo",
    points: [
      "Take the Gombe–Yola highway south from Gombe town.",
      "You pass Kumo, then Billiri; Kaltungo is the next major town after Billiri.",
      "Kaltungo is a little over 50 km from Gombe in a straight line — allow extra time for road and holiday traffic.",
      "Travel in daylight on December 29 or the morning of December 30 so you arrive before the medical checkup closes at 5:00 PM.",
    ],
  },
  {
    id: "stay",
    title: "Where to stay",
    summary: "Kaltungo, Billiri or Gombe",
    points: [
      "Kaltungo town: closest to every venue — guest houses fill early at year-end, so book ahead.",
      "Billiri: a short drive back up the highway if Kaltungo is full.",
      "Gombe town: the widest choice of hotels, but too far for a comfortable 4:00 AM muster — stay in Kaltungo on the night of December 30.",
      "Call the expedition lines for the current list of recommended lodgings.",
    ],
  },
  {
    id: "camp",
    title: "Camping",
    summary: "Ask before you pitch",
    points: [
      "Camping near the convergence point is by arrangement with the organisers and the community.",
      "Bring your own tent, sleeping mat and warm bedding — December nights are cold.",
      "No open fires on or near the mountain. Carry out everything you carry in.",
    ],
  },
];

export const SAFETY_RULES = [
  "No medical clearance on December 30, no climb on December 31.",
  "Stay with your group and follow the guides and marshals at all times.",
  "Start hydrated. Drink before you feel thirsty.",
  "If you feel dizzy, breathless or unwell, stop and tell the nearest marshal.",
  "Respect the mountain, its sacred sites and the host community.",
];

/**
 * Gallery / social feed.
 * Replace the placeholders with real posts as they are published:
 *   - YouTube:  { platform: "youtube", embedId: "VIDEO_ID", ... }  → plays inline
 *   - Others:   set `url` to the post link → the tile opens the post
 * Add photos by placing files in /public/gallery and setting `image`.
 */
export type GalleryItem = {
  id: string;
  platform: "youtube" | "instagram" | "tiktok" | "x" | "facebook" | "photo";
  title: string;
  caption: string;
  url?: string;
  embedId?: string;
  image?: string;
  span?: "wide" | "tall";
};

export const GALLERY: GalleryItem[] = [
  {
    id: "g1",
    platform: "youtube",
    title: "Expedition film",
    caption: "Watch the ascent on YouTube",
    url: "https://youtube.com/@KilangExpedition",
    span: "wide",
  },
  {
    id: "g2",
    platform: "instagram",
    title: "Summit reels",
    caption: "First light from the peak",
    url: "https://instagram.com/KilangExpedition",
    span: "tall",
  },
  {
    id: "g3",
    platform: "tiktok",
    title: "Trail clips",
    caption: "Moments from the climb",
    url: "https://www.tiktok.com/@KilangExpedition",
  },
  {
    id: "g4",
    platform: "x",
    title: "Expedition threads",
    caption: "Updates and announcements",
    url: "https://x.com/KilangExpedition",
  },
  {
    id: "g5",
    platform: "facebook",
    title: "Community album",
    caption: "Faces of the expedition",
    url: "https://facebook.com/KilangExpedition",
  },
  {
    id: "g6",
    platform: "photo",
    title: "Your photo here",
    caption: "Tag @KilangExpedition to be featured",
    span: "wide",
  },
];

/**
 * Photos and films from previous expeditions (files live in /public/gallery).
 * To add more: drop the file in /public/gallery and add an entry here.
 *   size:  "feature" = large landscape, "wide" = landscape strip, "tall" = portrait
 *   focus: optional CSS object-position to keep the subject in frame on the tile
 */
export type MediaItem = {
  id: string;
  kind: "photo" | "video";
  title: string;
  caption: string;
  /** Describes the picture for screen readers. */
  alt: string;
  src: string;
  /** Still frame shown before a video plays. */
  poster?: string;
  width: number;
  height: number;
  /** Video length in seconds. */
  duration?: number;
  size: "feature" | "wide" | "tall";
  focus?: string;
};

export const PAST_MEDIA: MediaItem[] = [
  {
    id: "p-summit-team",
    kind: "photo",
    title: "Standing on the summit",
    caption: "A team gathers on the summit rocks, the plains of Kaltungo far below.",
    alt: "Seven climbers standing together on the rocky summit, one holding a tall staff.",
    src: "/gallery/summit-team.jpg",
    width: 1080,
    height: 810,
    size: "feature",
  },
  {
    id: "p-above-the-valley",
    kind: "photo",
    title: "Above the valley",
    caption: "A pause on the upper slopes, with the valley falling away behind.",
    alt: "A climber in a blue shirt and sunglasses posing on the rocky upper slope.",
    src: "/gallery/above-the-valley.jpg",
    width: 720,
    height: 908,
    size: "tall",
    focus: "50% 20%",
  },
  {
    id: "p-joy-at-the-top",
    kind: "photo",
    title: "Joy at the top",
    caption: "Applause on the summit: the reward for every step of the climb.",
    alt: "A climber in a yellow shirt clapping on the summit under a clear blue sky.",
    src: "/gallery/joy-at-the-top.jpg",
    width: 810,
    height: 1080,
    size: "tall",
    focus: "50% 25%",
  },
  {
    id: "p-rock-scramble",
    kind: "photo",
    title: "The rock scramble",
    caption: "Hands and feet on the steep rock section below the summit.",
    alt: "Climbers pulling themselves up a steep rock face.",
    src: "/gallery/rock-scramble.jpg",
    width: 810,
    height: 1080,
    size: "tall",
  },
  {
    id: "p-friends-on-the-trail",
    kind: "photo",
    title: "Friends on the trail",
    caption: "Expedition colours on the grassy lower slopes as the ascent begins.",
    alt: "Four hikers smiling on a grassy trail, one in a red Kilang Mountain Expedition shirt.",
    src: "/gallery/friends-on-the-trail.jpg",
    width: 709,
    height: 474,
    size: "wide",
    focus: "50% 30%",
  },
  {
    id: "p-foot-of-kilang",
    kind: "photo",
    title: "At the foot of Kilang",
    caption: "Setting out among the palms, with the hills waiting ahead.",
    alt: "A climber in a blue shirt with a backpack at the foot of the mountain.",
    src: "/gallery/foot-of-kilang.jpg",
    width: 720,
    height: 919,
    size: "tall",
    focus: "50% 20%",
  },
  {
    id: "p-gathering",
    kind: "photo",
    title: "Gathering before the climb",
    caption: "Climbers and the community meet in the shade before setting off.",
    alt: "Two smiling participants in front of a crowd gathered under a large tree.",
    src: "/gallery/gathering-before-the-climb.jpg",
    width: 1080,
    height: 810,
    size: "wide",
    focus: "50% 8%",
  },
  {
    id: "v-through-the-boulders",
    kind: "video",
    title: "Up through the boulders",
    caption: "Climbers pick their way up the boulder field on the way to the summit.",
    alt: "Climbers working their way up between large boulders.",
    src: "/gallery/through-the-boulders.mp4",
    poster: "/gallery/through-the-boulders-poster.jpg",
    width: 640,
    height: 360,
    duration: 33,
    size: "feature",
  },
  {
    id: "v-smiles-at-the-summit",
    kind: "video",
    title: "Smiles at the summit",
    caption: "Greetings and laughter among the crowd at the top of Kilang.",
    alt: "A smiling man in a woollen cap on the summit with climbers behind him.",
    src: "/gallery/smiles-at-the-summit.mp4",
    poster: "/gallery/smiles-at-the-summit-poster.jpg",
    width: 360,
    height: 640,
    duration: 41,
    size: "tall",
    focus: "50% 30%",
  },
  {
    id: "v-the-final-ascent",
    kind: "video",
    title: "The final ascent",
    caption: "A climber's-eye view of the steep last stretch and the land below.",
    alt: "A climber in a white cap scrambling up steep rock high above the plains.",
    src: "/gallery/the-final-ascent.mp4",
    poster: "/gallery/the-final-ascent-poster.jpg",
    width: 360,
    height: 640,
    duration: 128,
    size: "tall",
  },
  {
    id: "v-arriving-at-the-top",
    kind: "video",
    title: "Arriving at the top",
    caption: "The line of climbers files onto the summit ridge to join the crowd.",
    alt: "A large crowd of climbers gathered on the rocky summit ridge.",
    src: "/gallery/arriving-at-the-top.mp4",
    poster: "/gallery/arriving-at-the-top-poster.jpg",
    width: 640,
    height: 368,
    duration: 29,
    size: "feature",
  },
  {
    id: "v-summit-celebration",
    kind: "video",
    title: "Celebration on the summit",
    caption: "Song and dance on the peak as climbers celebrate reaching the top.",
    alt: "Climbers dancing together on the summit.",
    src: "/gallery/summit-celebration.mp4",
    poster: "/gallery/summit-celebration-poster.jpg",
    width: 640,
    height: 368,
    duration: 18,
    size: "feature",
  },
];
