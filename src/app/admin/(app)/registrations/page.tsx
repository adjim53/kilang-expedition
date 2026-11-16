import { Suspense } from "react";
import { requirePage } from "@/lib/admin-auth";
import { can } from "@/lib/auth/roles";
import { RegistrationsTable } from "@/components/admin/registrations-table";

export const metadata = { title: "Registrations" };

export default async function RegistrationsPage() {
  const user = await requirePage("registrations.view", "/admin/registrations");
  return (
    <Suspense>
      <RegistrationsTable canExport={can(user.role, "registrations.export")} />
    </Suspense>
  );
}
