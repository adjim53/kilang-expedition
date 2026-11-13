import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

/**
 * Normalise a Nigerian mobile number to international format without "+":
 * 08031907825 / +2348031907825 / 2348031907825 / 8031907825 → 2348031907825.
 * Returns null if it is not a plausible Nigerian mobile number.
 */
export function normalizeNigerianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let local: string;
  if (digits.startsWith("234") && digits.length === 13) local = digits.slice(3);
  else if (digits.startsWith("0") && digits.length === 11) local = digits.slice(1);
  else if (digits.length === 10) local = digits;
  else return null;
  if (!/^[789][01]\d{8}$/.test(local)) return null;
  return `234${local}`;
}

/** 2348031907825 → 0803 190 7825 */
export function displayPhone(normalized: string) {
  const local = normalized.startsWith("234") ? `0${normalized.slice(3)}` : normalized;
  return local.replace(/^(\d{4})(\d{3})(\d{4})$/, "$1 $2 $3");
}

/**
 * Read an env var at request time. Next.js inlines `process.env.NEXT_PUBLIC_*`
 * at build time; a computed key is not inlined, so values set on the host
 * (e.g. Vercel environment variables) take effect without rebuilding. Server-only.
 */
export function runtimeEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

export function appUrl() {
  return (runtimeEnv("NEXT_PUBLIC_APP_URL") || "http://localhost:3000").replace(/\/$/, "");
}

export function formatWAT(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}
