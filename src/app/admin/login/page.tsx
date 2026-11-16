import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin-auth";
import { homeFor } from "@/lib/auth/roles";
import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff sign-in",
  robots: { index: false, follow: false },
};

/** Only same-site admin paths — never an open redirect. */
function safeNext(next: string | undefined) {
  return next && /^\/admin(\/[\w\-/]*)?(\?[\w=&%-]*)?$/.test(next) ? next : null;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const user = await getAdminUser();
  if (user) redirect(user.mustChangePassword ? "/admin/account?first=1" : (next ?? homeFor(user.role)));
  return <LoginForm next={next} />;
}
