import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { passConfirmationSms, sendSms } from "@/lib/sms";

beforeEach(() => {
  vi.stubEnv("TERMII_API_KEY", "TL_test");
  vi.stubEnv("TERMII_SENDER_ID", "Kilang");
  vi.stubEnv("TERMII_BASE_URL", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Termii sendSms", () => {
  it("uses the exact confirmation copy", () => {
    expect(passConfirmationSms("KIL-2026-AB3D")).toBe(
      "Welcome to Kilang Expedition 2026! Your Pass ID is KIL-2026-AB3D. See you Dec 30 at Kaleh Infotech for Medicals.",
    );
  });

  it("reports success only when Termii returns code ok", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Response.json({ code: "ok", message_id: "m-1", message: "Successfully Sent" }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(sendSms("2348031907825", "hi")).resolves.toEqual({ ok: true, messageId: "m-1" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.ng.termii.com/api/sms/send");
    expect(JSON.parse(init!.body as string)).toMatchObject({
      to: "2348031907825",
      from: "Kilang",
      channel: "generic",
    });
  });

  it("treats a rejected sender ID as a failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ message: "ApplicationSenderId not found" }, { status: 404 })),
    );
    await expect(sendSms("2348031907825", "hi")).resolves.toEqual({
      ok: false,
      error: "ApplicationSenderId not found",
    });
  });

  it("treats a 200 without code ok as a failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ message: "Insufficient balance" })));
    expect((await sendSms("2348031907825", "hi")).ok).toBe(false);
  });

  it("skips when not configured", async () => {
    vi.stubEnv("TERMII_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(sendSms("2348031907825", "hi")).resolves.toEqual({ ok: false, skipped: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
