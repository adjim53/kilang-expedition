import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { EVENT } from "@/data/event";

/** The preview picture shown when the site is shared on WhatsApp, X, Facebook… */
export const alt = `${EVENT.name} — ${EVENT.theme}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const badge = await readFile(path.join(process.cwd(), "public", "brand", "kilang-expedition-badge.png"));
  const badgeSrc = `data:image/png;base64,${badge.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0A2B29",
          padding: "64px 72px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", top: 0, left: 0 }}>
          <path d="M620 630 L900 330 L990 430 L1080 300 L1260 630 Z" fill="#134E4A" />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
        <img
          src={badgeSrc}
          width={330}
          height={330}
          alt=""
          style={{ position: "absolute", right: 70, top: 120, borderRadius: 999, border: "8px solid rgba(255,255,255,0.12)" }}
        />
        <div style={{ display: "flex", color: "#F59E0B", fontSize: 26, fontWeight: 700, letterSpacing: 6 }}>
          KALTUNGO · GOMBE STATE · 30–31 DECEMBER 2026
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
          <div style={{ display: "flex", color: "#FFFFFF", fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>
            {EVENT.name}
          </div>
          <div style={{ display: "flex", color: "#D5E9E6", fontSize: 32, marginTop: 24, lineHeight: 1.3 }}>
            {EVENT.theme}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            background: "#F59E0B",
            color: "#0C211F",
            fontSize: 28,
            fontWeight: 700,
            padding: "14px 32px",
            borderRadius: 999,
          }}
        >
          Register to climb · kilangexpe.org
        </div>
      </div>
    ),
    size,
  );
}
