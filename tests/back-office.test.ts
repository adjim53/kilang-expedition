import { describe, expect, it } from "vitest";
import {
  generateTemporaryPassword,
  hashPassword,
  passwordProblem,
  verifyPassword,
} from "@/lib/auth/password";
import { can, homeFor, isRole } from "@/lib/auth/roles";
import { parseScannedPass } from "@/lib/pass-id";
import { tokensMatch } from "@/lib/ids";
import { csvCell } from "@/lib/registrations";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("four goats climbed Kilang");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("four goats climbed Kilang", hash)).toBe(true);
    expect(await verifyPassword("four goats climbed kilang", hash)).toBe(false);
  });

  it("salts every hash", async () => {
    expect(await hashPassword("same password here")).not.toBe(await hashPassword("same password here"));
  });

  it("rejects malformed stored hashes", async () => {
    expect(await verifyPassword("x", "plaintext")).toBe(false);
    expect(await verifyPassword("x", "")).toBe(false);
  });

  it("generates readable temporary passwords that pass the rules", () => {
    const pw = generateTemporaryPassword();
    expect(pw).toMatch(/^kilang-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
    expect(passwordProblem(pw)).toBeNull();
  });

  it("refuses weak passwords", () => {
    expect(passwordProblem("short")).toMatch(/at least/);
    expect(passwordProblem("aaaaaaaaaaaa")).not.toBeNull();
    expect(passwordProblem("mypassword123")).not.toBeNull();
    expect(passwordProblem("ajime-mountain-day", { email: "ajime@example.com" })).not.toBeNull();
    expect(passwordProblem("four goats climbed Kilang")).toBeNull();
  });
});

describe("roles", () => {
  it("marshals can check in but not see registrations or manage users", () => {
    expect(can("MARSHAL", "checkin")).toBe(true);
    expect(can("MARSHAL", "registrations.view")).toBe(false);
    expect(can("MARSHAL", "users.manage")).toBe(false);
  });

  it("staff manage registrations but not users, cancellations or offline payments", () => {
    expect(can("STAFF", "registrations.edit")).toBe(true);
    expect(can("STAFF", "registrations.export")).toBe(true);
    expect(can("STAFF", "users.manage")).toBe(false);
    expect(can("STAFF", "registrations.cancel")).toBe(false);
    expect(can("STAFF", "payments.offline")).toBe(false);
  });

  it("admins can do everything", () => {
    expect(can("ADMIN", "users.manage")).toBe(true);
    expect(can("ADMIN", "payments.offline")).toBe(true);
  });

  it("unknown roles can do nothing", () => {
    expect(can("OWNER", "checkin")).toBe(false);
    expect(can(null, "checkin")).toBe(false);
    expect(isRole("admin")).toBe(false);
  });

  it("sends each role to the right home page", () => {
    expect(homeFor("MARSHAL")).toBe("/admin/checkin");
    expect(homeFor("STAFF")).toBe("/admin/registrations");
  });
});

describe("scanned QR codes", () => {
  const token = "AbCdEfGhIjKlMnOpQrStUvWxYz012345";

  it("reads pass ID and token from a genuine pass URL", () => {
    expect(parseScannedPass(`https://www.kilangexpe.org/pass/KIL-2026-AB3D?t=${token}`)).toEqual({
      passId: "KIL-2026-AB3D",
      token,
    });
  });

  it("treats a bare pass ID as having no token", () => {
    expect(parseScannedPass("kil-2026-ab3d")).toEqual({ passId: "KIL-2026-AB3D", token: null });
  });

  it("ignores tokens on non-pass URLs and malformed tokens", () => {
    expect(parseScannedPass(`https://evil.example/?x=KIL-2026-AB3D&t=${token}`).token).toBeNull();
    expect(parseScannedPass("https://x.org/pass/KIL-2026-AB3D?t=<script>").token).toBeNull();
  });

  it("returns nothing for unrelated codes", () => {
    expect(parseScannedPass("https://example.com/hello")).toEqual({ passId: null, token: null });
  });
});

describe("tokensMatch", () => {
  it("matches only the exact token", () => {
    expect(tokensMatch("abc123", "abc123")).toBe(true);
    expect(tokensMatch("abc124", "abc123")).toBe(false);
    expect(tokensMatch("", "abc123")).toBe(false);
    expect(tokensMatch(null, "abc123")).toBe(false);
  });
});

describe("csvCell", () => {
  it("quotes values and escapes quotes", () => {
    expect(csvCell('Ade "Big" Musa')).toBe('"Ade ""Big"" Musa"');
    expect(csvCell(null)).toBe('""');
  });

  it("defuses spreadsheet formulas typed into the form", () => {
    expect(csvCell('=HYPERLINK("http://x","click")')).toBe(`"'=HYPERLINK(""http://x"",""click"")"`);
    expect(csvCell("+2348031907825")).toBe(`"'+2348031907825"`);
    expect(csvCell("@SUM(A1)")).toBe(`"'@SUM(A1)"`);
  });
});
