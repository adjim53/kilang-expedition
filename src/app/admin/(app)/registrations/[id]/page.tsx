import { requirePage } from "@/lib/admin-auth";
import { RegistrationDetailView } from "@/components/admin/registration-detail";

export const metadata = { title: "Registration" };

export default async function RegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePage("registrations.view", `/admin/registrations/${id}`);
  return <RegistrationDetailView id={id} />;
}
