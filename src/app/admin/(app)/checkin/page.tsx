import type { Metadata } from "next";
import { requirePage } from "@/lib/admin-auth";
import { CheckinPortal } from "@/components/admin/checkin-portal";

export const metadata: Metadata = { title: "Check-in" };

export default async function CheckinPage() {
  await requirePage("checkin", "/admin/checkin");
  return <CheckinPortal />;
}
