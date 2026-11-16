/** Browser-safe role definitions. */

export const ROLES = ["ADMIN", "STAFF", "MARSHAL"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_INFO: Record<Role, { label: string; description: string }> = {
  ADMIN: {
    label: "Admin",
    description: "Everything, including users, cancellations and offline payments.",
  },
  STAFF: {
    label: "Registration staff",
    description: "View, edit and export registrations, resend passes, check climbers in.",
  },
  MARSHAL: {
    label: "Marshal",
    description: "Scan passes and check climbers in at the medical checkup and the muster point.",
  },
};

export type Permission =
  | "checkin" // scan passes, search paid climbers, mark medical/muster
  | "passes.resend"
  | "registrations.view"
  | "registrations.edit"
  | "registrations.export"
  | "payments.verify" // re-check a pending payment with Paystack
  | "registrations.cancel" // cancel / reinstate
  | "payments.offline" // confirm cash or bank-transfer payment
  | "users.manage";

const PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: [
    "checkin",
    "passes.resend",
    "registrations.view",
    "registrations.edit",
    "registrations.export",
    "payments.verify",
    "registrations.cancel",
    "payments.offline",
    "users.manage",
  ],
  STAFF: [
    "checkin",
    "passes.resend",
    "registrations.view",
    "registrations.edit",
    "registrations.export",
    "payments.verify",
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
