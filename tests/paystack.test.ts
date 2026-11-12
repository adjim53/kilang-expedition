import crypto from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isValidWebhookSignature, paystackMode, verifyTransaction } from "@/lib/paystack";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Paystack webhook signature", () => {
  const body = JSON.stringify({ event: "charge.success", data: { reference: "KIL26-ABC" } });
  const sign = (key: string, payload = body) => crypto.createHmac("sha512", key).update(payload).digest("hex");

  it("accepts a correct HMAC-SHA512 signature", () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "sk_test_secret");
    expect(isValidWebhookSignature(body, sign("sk_test_secret"))).toBe(true);
  });

  it("rejects a tampered body, wrong key or missing header", () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "sk_test_secret");
    expect(isValidWebhookSignature(body + " ", sign("sk_test_secret"))).toBe(false);
    expect(isValidWebhookSignature(body, sign("other"))).toBe(false);
    expect(isValidWebhookSignature(body, null)).toBe(false);
    expect(isValidWebhookSignature(body, "short")).toBe(false);
  });

  it("rejects everything when no secret is configured", () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "");
    expect(isValidWebhookSignature(body, "anything")).toBe(false);
  });
});

describe("Paystack mode and verify", () => {
  it("detects test and live keys", () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "sk_test_x");
    expect(paystackMode()).toBe("test");
    vi.stubEnv("PAYSTACK_SECRET_KEY", "sk_live_x");
    expect(paystackMode()).toBe("live");
  });

  it("maps a verified transaction", async () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "sk_test_x");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          status: true,
          data: { id: 42, reference: "R1", status: "success", amount: 500000, currency: "NGN" },
        }),
      ),
    );
    await expect(verifyTransaction("R1")).resolves.toEqual({
      id: "42",
      reference: "R1",
      status: "success",
      amountKobo: 500000,
      currency: "NGN",
    });
  });

  it("returns null when Paystack is unreachable", async () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "sk_test_x");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(verifyTransaction("R1")).resolves.toBeNull();
  });
});
