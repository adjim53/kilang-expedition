import { redirect } from "next/navigation";
import { requirePage } from "@/lib/admin-auth";
import { homeFor } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const user = await requirePage(null, "/admin");
  redirect(homeFor(user.role));
}
