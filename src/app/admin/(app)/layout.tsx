import type { Metadata } from "next";
import { getAdminUser } from "@/lib/admin-auth";
import { can, isRole, ROLE_INFO } from "@/lib/auth/roles";
import { AdminNav, type NavLink } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Back office", template: "%s · Kilang back office" },
  robots: { index: false, follow: false },
};

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  // Each page enforces its own permission; the layout only draws the menu.
  const user = await getAdminUser();
  const links: NavLink[] = [];
  if (user && !user.mustChangePassword) {
    if (can(user.role, "registrations.view")) links.push({ href: "/admin/registrations", label: "Registrations", icon: "registrations" });
    if (can(user.role, "checkin")) links.push({ href: "/admin/checkin", label: "Check-in", icon: "checkin" });
    if (can(user.role, "users.manage")) links.push({ href: "/admin/users", label: "Users", icon: "users" });
  }
  if (user) links.push({ href: "/admin/account", label: "Account", icon: "account" });

  return (
    <div className="min-h-screen bg-sand-100">
      {user && <AdminNav links={links} name={user.name} roleLabel={isRole(user.role) ? ROLE_INFO[user.role].label : user.role} />}
      {children}
    </div>
  );
}
