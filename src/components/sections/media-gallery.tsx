"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Film, Play, X } from "lucide-react";
import { PAST_MEDIA, type MediaItem } from "@/data/content";
import { cn } from "@/lib/utils";

const SIZE: Record<MediaItem["size"], string> = {
  feature: "sm:col-span-2 sm:row-span-2",
  wide: "sm:col-span-2",
  tall: "row-span-2",
};

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function Tile({ item, onOpen }: { item: MediaItem; onOpen: (trigger: HTMLButtonElement) => void }) {
  const isVideo = item.kind === "video";
  return (
    <button
      type="button"
      onClick={(e) => onOpen(e.currentTarget)}
      aria-label={`${isVideo ? "Play video" : "View photo"}: ${item.title}`}
      className={cn(
        "group relative isolate flex min-h-[220px] overflow-hidden rounded-2xl bg-forest-950 text-left text-white shadow-sm outline-none ring-amber-400 ring-offset-2 ring-offset-forest-900 focus-visible:ring-2",
        SIZE[item.size],
      )}
    >
      <Image
        src={isVideo ? item.poster! : item.src}
        alt={item.alt}
        fill
        sizes="(min-width: 1024px) 50vw, (min-width: 640px) 100vw, 100vw"
        className="-z-10 object-cover transition duration-500 group-hover:scale-105"
        style={item.focus ? { objectPosition: item.focus } : undefined}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

      {isVideo && (
        <>
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-xs font-bold backdrop-blur">
            <Film className="h-3.5 w-3.5" /> {formatDuration(item.duration ?? 0)}
          </span>
          <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/25 backdrop-blur transition group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-ink">
            <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" />
          </span>
        </>
      )}

      <div className="mt-auto p-5">
        <p className="font-display text-xl font-semibold leading-tight sm:text-2xl">{item.title}</p>
        <p className="mt-1 text-sm text-white/85">{item.caption}</p>
      </div>
    </button>
  );
}

function Lightbox({
  index,
  onClose,
  onStep,
}: {
  index: number;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const item = PAST_MEDIA[index];
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onStep]);

  const arrow =
    "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white transition hover:bg-amber-500 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="no-print fixed inset-0 z-[100] flex flex-col bg-forest-950/95 text-white backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <p className="text-sm font-bold tracking-wide text-white/70">
          {index + 1} / {PAST_MEDIA.length}
        </p>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className={arrow}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center gap-2 px-2 sm:gap-4 sm:px-6">
        <button
          type="button"
          aria-label="Previous"
          className={arrow}
          onClick={(e) => {
            e.stopPropagation();
            onStep(-1);
          }}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center" onClick={(e) => e.stopPropagation()}>
          {item.kind === "video" ? (
            <video
              key={item.src}
              src={item.src}
              poster={item.poster}
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="rounded-xl bg-black shadow-lift"
              style={{
                aspectRatio: `${item.width} / ${item.height}`,
                // Never taller than 70% of the screen, never stretched past 1.5x its real size.
                width: `min(100%, ${Math.round(item.width * 1.5)}px, calc(70vh * ${item.width} / ${item.height}))`,
              }}
            />
          ) : (
            <Image
              key={item.src}
              src={item.src}
              alt={item.alt}
              width={item.width}
              height={item.height}
              sizes="100vw"
              priority
              className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-lift"
            />
          )}
        </div>

        <button
          type="button"
          aria-label="Next"
          className={arrow}
          onClick={(e) => {
            e.stopPropagation();
            onStep(1);
          }}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="px-6 pb-6 pt-4 text-center" onClick={(e) => e.stopPropagation()}>
        <p className="font-display text-2xl font-semibold">{item.title}</p>
        <p className="mx-auto mt-1 max-w-xl text-sm text-white/80">{item.caption}</p>
      </div>
    </div>
  );
}

function Group({
  icon: Icon,
  title,
  note,
  children,
}: {
  icon: React.ElementType;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-white/15 pb-3">
        <h3 className="flex items-center gap-2.5 font-display text-2xl font-semibold">
          <Icon className="h-5 w-5 text-amber-400" /> {title}
        </h3>
        <p className="text-sm text-forest-100">{note}</p>
      </div>
      <div className="mt-5 grid grid-flow-dense auto-rows-[220px] gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </div>
  );
}

/** Photos and films from previous expeditions, with a full-screen viewer. */
export function MediaGallery() {
  const [open, setOpen] = useState<number | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setOpen(null);
    trigger.current?.focus();
  }, []);
  const step = useCallback((delta: number) => {
    setOpen((i) => (i === null ? i : (i + delta + PAST_MEDIA.length) % PAST_MEDIA.length));
  }, []);

  const tiles = (kind: MediaItem["kind"]) =>
    PAST_MEDIA.map((item, i) =>
      item.kind === kind ? (
        <Tile
          key={item.id}
          item={item}
          onOpen={(el) => {
            trigger.current = el;
            setOpen(i);
          }}
        />
      ) : null,
    );

  const photos = PAST_MEDIA.filter((m) => m.kind === "photo").length;
  const films = PAST_MEDIA.length - photos;

  return (
    <>
      <Group icon={Camera} title="Photographs" note={`${photos} photos from past expeditions`}>
        {tiles("photo")}
      </Group>
      <Group icon={Film} title="Films from the trail" note={`${films} short films · tap to play`}>
        {tiles("video")}
      </Group>
      {open !== null && <Lightbox index={open} onClose={close} onStep={step} />}
    </>
  );
}
