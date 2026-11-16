import { afterEach, describe, expect, it } from "vitest";
import { appUrl, displayPhone, formatNaira, normalizeNigerianPhone } from "@/lib/utils";
import { extractPassId } from "@/lib/pass-id";
import { generateAccessToken, generatePassId, generateReference } from "@/lib/ids";

describe("normalizeNigerianPhone", () => {
  it.each([
    ["08031907825", "2348031907825"],
    ["+234 803 190 7825", "2348031907825"],
    ["2348136571113", "2348136571113"],
    ["8027367193", "2348027367193"],
    ["0913-000-0000", "2349130000000"],
  ])("%s -> %s", (input, expected) => expect(normalizeNigerianPhone(input)).toBe(expected));

  it.each(["", "12345", "05031907825", "+447700900123", "080319078251"])("rejects %s", (input) =>
    expect(normalizeNigerianPhone(input)).toBeNull(),
  );
});

describe("formatting", () => {
  it("displays a normalised phone", () => expect(displayPhone("2348031907825")).toBe("0803 190 7825"));
  it("formats kobo as naira", () => expect(formatNaira(1_000_000)).toMatch(/10,000/));
});

describe("ids", () => {
  it("pass IDs look like KIL-2026-XXXX without ambiguous characters", () => {
    for (let i = 0; i < 200; i++) expect(generatePassId()).toMatch(/^KIL-2026-[2-9A-HJKMNP-Z]{4}$/);
  });

  it("references are unique and prefixed", () => {
    const refs = new Set(Array.from({ length: 500 }, generateReference));
    expect(refs.size).toBe(500);
    for (const r of refs) expect(r).toMatch(/^KIL26-[2-9A-Z]{12}$/);
  });

  it("access tokens are long and url-safe", () => expect(generateAccessToken()).toMatch(/^[\w-]{32}$/));

  it("extracts pass IDs from scanned URLs", () => {
    expect(extractPassId("https://x.test/pass/kil-2026-ab3d?t=abc")).toBe("KIL-2026-AB3D");
    expect(extractPassId("nothing here")).toBeNull();
  });
});

describe("appUrl", () => {
  const keys = ["NEXT_PUBLIC_APP_URL", "VERCEL_ENV", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL"] as const;
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  const set = (env: Partial<Record<(typeof keys)[number], string>>) => {
    for (const k of keys) delete process.env[k];
    Object.assign(process.env, env);
  };
  afterEach(() => set(saved as Record<string, string>));

  it("prefers NEXT_PUBLIC_APP_URL and drops a trailing slash", () => {
    set({ NEXT_PUBLIC_APP_URL: "https://www.kilangexpe.org/", VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" });
    expect(appUrl()).toBe("https://www.kilangexpe.org");
  });
  it("uses Vercel's production domain when not set", () => {
    set({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "www.kilangexpe.org" });
    expect(appUrl()).toBe("https://www.kilangexpe.org");
  });
  it("uses the deployment URL on previews", () => {
    set({ VERCEL_ENV: "preview", VERCEL_URL: "kilang-abc.vercel.app", VERCEL_PROJECT_PRODUCTION_URL: "www.kilangexpe.org" });
    expect(appUrl()).toBe("https://kilang-abc.vercel.app");
  });
  it("falls back to localhost in development", () => {
    set({});
    expect(appUrl()).toBe("http://localhost:3000");
  });
});
