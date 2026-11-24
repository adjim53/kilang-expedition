/** Browser-safe role definitions. */

export const ROLES = ["ADMIN", "STAFF", "MARSHAL"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_INFO: Record<Role, { label: string; description: string }> = {
  ADMIN: {
    label: "Admin",
    description: "Everything, including users, cancellations and donations.",
  },
  STAFF: {
    label: "Registration staff",
    description: "View, edit and export registrations, resend passes, check climbers in.",
  },
  MARSHAL: {
    label: "Marshal",
    description: "Scan passes and record climbers at the medical checkup, the ascent start, the summit and back at base.",
  },
};

export type Permission =
  | "checkin" // scan passes, search climbers, record checkpoints, watch the summit tracker
  | "passes.resend"
  | "registrations.view" // includes printing registration slips
  | "registrations.edit"
  | "registrations.export"
  | "registrations.cancel" // cancel / reinstate
  | "donations.view" // see and export donations, re-check one with Paystack
  | "users.manage";

const PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: [
    "checkin",
    "passes.resend",
    "registrations.view",
    "registrations.edit",
    "registrations.export",
    "registrations.cancel",
    "donations.view",
    "users.manage",
  ],
  STAFF: [
    "checkin",
    "passes.resend",
    "registrations.view",
    "registrations.edit",
    "registrations.export",
  ],
  MARSHAL: ["checkin", "passes.resend"],
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function can(role: string | null | undefined, permission: Permission) {
  return isRole(role) && PERMISSIONS[role].includes(permission);
}

/** Where each role lands after signing in. */
export function homeFor(role: string) {
  return can(role, "registrations.view") ? "/admin/registrations" : "/admin/checkin";
}
