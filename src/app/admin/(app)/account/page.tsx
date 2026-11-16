import { requirePage } from "@/lib/admin-auth";
import { isRole, ROLE_INFO } from "@/lib/auth/roles";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { AccountForm } from "@/components/admin/account-form";

export const metadata = { title: "Your account" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ first?: string }> }) {
  const user = await requirePage(null, "/admin/account");
  const first = user.mustChangePassword || (await searchParams).first === "1";

  return (
    <main className="container max-w-xl py-8">
      <h1 className="text-3xl font-semibold text-forest-900">Your account</h1>
      <dl className="mt-4 grid gap-1 text-sm text-forest-900/80">
        <div>
          <dt className="inline font-bold">Name: </dt>
          <dd className="inline">{user.name}</dd>
        </div>
        <div>
          <dt className="inline font-bold">Email: </dt>
          <dd className="inline">{user.email}</dd>
        </div>
        <div>
          <dt className="inline font-bold">Role: </dt>
          <dd className="inline">
            {isRole(user.role) ? `${ROLE_INFO[user.role].label} — ${ROLE_INFO[user.role].description}` : user.role}
          </dd>
        </div>
      </dl>
      <AccountForm first={first} mustChange={user.mustChangePassword} minLength={MIN_PASSWORD_LENGTH} />
    </main>
  );
}
