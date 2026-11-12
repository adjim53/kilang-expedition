import { cn } from "@/lib/utils";

/** Deterministic contour rings — a topographic-map texture for backgrounds. */
function ring(cx: number, cy: number, r: number, seed: number) {
  const points: string[] = [];
  const steps = 72;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const wobble =
      1 +
      0.09 * Math.sin(a * 3 + seed) +
      0.06 * Math.sin(a * 5 + seed * 1.7) +
      0.035 * Math.cos(a * 8 + seed * 0.6);
    const x = cx + Math.cos(a) * r * wobble * 1.25;
    const y = cy + Math.sin(a) * r * wobble;
    points.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `${points.join(" ")} Z`;
}

const SUMMITS = [
  { cx: 260, cy: 210, seed: 1.2, count: 9, gap: 26 },
  { cx: 940, cy: 150, seed: 4.1, count: 7, gap: 30 },
  { cx: 700, cy: 520, seed: 2.6, count: 8, gap: 28 },
  { cx: 120, cy: 620, seed: 5.3, count: 6, gap: 30 },
];

export function Topo({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      {SUMMITS.map((s, si) =>
        Array.from({ length: s.count }, (_, i) => (
          <path
            key={`${si}-${i}`}
            d={ring(s.cx, s.cy, 14 + i * s.gap, s.seed + i * 0.11)}
            strokeWidth={i % 4 === 0 ? 1.6 : 0.8}
          />
        )),
      )}
    </svg>
  );
}
