import { describe, expect, it } from "vitest";
import { registrationSchema } from "@/lib/validation";
import { renderPassEmail } from "@/lib/email";

const valid = {
  tierId: "standard",
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

  it("requires the waiver and valid fields", () => {
    const result = registrationSchema.safeParse({ ...valid, waiverAccepted: false, genotype: "ZZ", phone: "123" });
    expect(result.success).toBe(false);
    const errors = result.success ? {} : result.error.flatten().fieldErrors;
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
      tierName: "Standard Climber",
    });
    expect(subject).toContain("KIL-2026-AB3D");
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("cid:pass-qr");
    expect(text).toContain("/pass/KIL-2026-AB3D?t=tok");
  });
});
