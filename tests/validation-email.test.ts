import { describe, expect, it } from "vitest";
import { donationSchema, registrationSchema } from "@/lib/validation";
import { renderDonationReceipt, renderPassEmail } from "@/lib/email";
import { z } from "zod";

const valid = {
  fullName: "Amina Bello",
  email: "  Amina@Example.com ",
  phone: "08031907825",
  nextOfKinName: "Musa Bello",
  nextOfKinPhone: "08136571113",
  bloodGroup: "O+",
  genotype: "AA",
  experience: "BEGINNER",
  kitSize: "M",
  waiverAccepted: true,
};

describe("registrationSchema", () => {
  it("accepts a complete form and normalises email", () => {
    const parsed = registrationSchema.parse(valid);
    expect(parsed.email).toBe("amina@example.com");
    expect(parsed.medicalNotes).toBe("");
  });

  it("needs no ticket or payment details", () => {
    expect(Object.keys(registrationSchema.shape)).not.toContain("tierId");
  });

  it("requires the waiver and valid fields", () => {
    const result = registrationSchema.safeParse({ ...valid, waiverAccepted: false, genotype: "ZZ", phone: "123" });
    expect(result.success).toBe(false);
    const errors = result.success ? {} : z.flattenError(result.error).fieldErrors;
    expect(Object.keys(errors).sort()).toEqual(["genotype", "phone", "waiverAccepted"]);
  });
});

describe("renderPassEmail", () => {
  it("includes the pass and escapes user-supplied HTML", () => {
    const { html, text, subject } = renderPassEmail({
      fullName: "<script>x</script> Bello",
      email: "a@b.co",
      passId: "KIL-2026-AB3D",
      accessToken: "tok",
    });
    expect(subject).toContain("KIL-2026-AB3D");
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("cid:pass-qr");
    expect(text).toContain("/pass/KIL-2026-AB3D?t=tok");
  });

  it("links to the printable slip and never mentions payment", () => {
    const { html, text } = renderPassEmail({ fullName: "Amina Bello", email: "a@b.co", passId: "KIL-2026-AB3D", accessToken: "tok" });
    expect(html).toContain("/pass/KIL-2026-AB3D/slip?t=tok");
    expect(text).toContain("/pass/KIL-2026-AB3D/slip?t=tok");
    expect(`${html} ${text}`).not.toMatch(/payment|ticket|paid/i);
  });
});

describe("donationSchema", () => {
  const gift = { amountNaira: "10000", donorType: "INDIVIDUAL", donorName: "Amina Bello", email: " Amina@Example.com " };

  it("accepts a well-wisher's gift and normalises it", () => {
    const parsed = donationSchema.parse(gift);
    expect(parsed.amountNaira).toBe(10000);
    expect(parsed.email).toBe("amina@example.com");
    expect(parsed.phone).toBe("");
  });

  it("requires an organisation name from partners", () => {
    const result = donationSchema.safeParse({ ...gift, donorType: "PARTNER" });
    expect(result.success).toBe(false);
    expect(donationSchema.safeParse({ ...gift, donorType: "PARTNER", organisation: "Plateau Hikers" }).success).toBe(true);
  });

  it.each(["0", "-5", "499", "12.50", "abc", "", "999999999999"])("rejects the amount %s", (amountNaira) => {
    expect(donationSchema.safeParse({ ...gift, amountNaira }).success).toBe(false);
  });

  it("rejects a bad phone but allows none", () => {
    expect(donationSchema.safeParse({ ...gift, phone: "123" }).success).toBe(false);
    expect(donationSchema.safeParse({ ...gift, phone: "08031907825" }).success).toBe(true);
  });
});

describe("renderDonationReceipt", () => {
  it("shows the amount and reference and escapes user-supplied HTML", () => {
    const { html, text, subject } = renderDonationReceipt({
      donorName: "<b>Musa</b> Bello",
      organisation: "Acme & Sons",
      email: "a@b.co",
      amountKobo: 2_500_000,
      reference: "KILD-ABC123",
      paidAt: new Date("2026-12-01T10:00:00Z"),
    });
    expect(subject).toContain("KILD-ABC123");
    expect(html).toMatch(/25,000/);
    expect(html).not.toContain("<b>Musa</b>");
    expect(html).toContain("Acme &amp; Sons");
    expect(text).toContain("KILD-ABC123");
  });
});
