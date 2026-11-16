import { requirePage } from "@/lib/admin-auth";
import { UsersManager } from "@/components/admin/users-manager";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requirePage("users.manage", "/admin/users");
  return <UsersManager meId={me.id} />;
}
