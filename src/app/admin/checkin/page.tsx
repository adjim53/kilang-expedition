import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin-auth";
import { CheckinPortal } from "@/components/admin/checkin-portal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Marshal check-in",
  robots: { index: false, follow: false },
};

export default async function CheckinPage() {
  return <CheckinPortal authed={await isAdmin()} />;
}
