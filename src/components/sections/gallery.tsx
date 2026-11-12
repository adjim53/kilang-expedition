import Image from "next/image";
import { Aperture, Camera, Clapperboard, MessagesSquare, Music2, Play, Users } from "lucide-react";
import { GALLERY, type GalleryItem } from "@/data/content";
import { CONTACT } from "@/data/event";
import { Reveal } from "@/components/reveal";
import { Topo } from "@/components/topo";
import { cn } from "@/lib/utils";

const PLATFORM: Record<GalleryItem["platform"], { label: string; icon: React.ElementType; tone: string }> = {
  youtube: { label: "YouTube", icon: Clapperboard, tone: "from-clay-600 to-forest-900" },
  instagram: { label: "Instagram", icon: Aperture, tone: "from-amber-600 to-clay-600" },
  tiktok: { label: "TikTok", icon: Music2, tone: "from-forest-800 to-forest-950" },
  x: { label: "X", icon: MessagesSquare, tone: "from-forest-600 to-forest-800" },
  facebook: { label: "Facebook", icon: Users, tone: "from-forest-500 to-forest-700" },
  photo: { label: "Photo", icon: Camera, tone: "from-sand-400 to-amber-600" },
};

function Tile({ item }: { item: GalleryItem }) {
  const meta = PLATFORM[item.platform];
  const Icon = meta.icon;
  const shape = cn(
    "group relative isolate flex min-h-[220px] overflow-hidden rounded-2xl text-white shadow-sm",
    item.span === "wide" && "sm:col-span-2",
    item.span === "tall" && "sm:row-span-2",
  );

  // A real YouTube video plays inline.
  if (item.platform === "youtube" && item.embedId) {
    return (
      <div className={cn(shape, "aspect-video min-h-0 bg-black")}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${item.embedId}`}
          title={item.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  const inner = (
    <>
      {item.image ? (
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="-z-10 object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <>
          <div className={cn("absolute inset-0 -z-20 bg-gradient-to-br", meta.tone)} />
          <Topo className="-z-10 text-white/15" />
        </>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />

      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1 text-xs font-bold backdrop-blur">
        <Icon className="h-3.5 w-3.5" /> {meta.label}
      </span>
      {item.platform !== "photo" && item.platform !== "x" && item.platform !== "facebook" && (
        <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/20 backdrop-blur transition group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-ink">
          <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" />
        </span>
      )}
      <div className="mt-auto p-5">
        <p className="font-display text-2xl font-semibold leading-tight">{item.title}</p>
        <p className="mt-1 text-sm text-white/85">{item.caption}</p>
      </div>
    </>
  );

  return item.url ? (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className={shape}>
      {inner}
    </a>
  ) : (
    <div className={shape}>{inner}</div>
  );
}

export function Gallery() {
  return (
    <section id="gallery" className="section bg-forest-900 text-white">
      <div className="container">
        <Reveal>
          <p className="eyebrow text-amber-400">Gallery &amp; social</p>
          <h2 className="section-title mt-3">See the mountain.</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-forest-100">
            Reels, clips, threads and films from the trail. Follow{" "}
            <strong className="text-amber-400">{CONTACT.handle}</strong> and tag us to be featured.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 grid auto-rows-[220px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GALLERY.map((item) => (
              <Tile key={item.id} item={item} />
            ))}
          </div>
        </Reveal>

        <ul className="mt-8 flex flex-wrap gap-2">
          {CONTACT.socials.map((s) => (
            <li key={s.name}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-full border border-white/25 px-4 py-2 text-sm font-bold transition hover:border-amber-400 hover:text-amber-400"
              >
                {s.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
