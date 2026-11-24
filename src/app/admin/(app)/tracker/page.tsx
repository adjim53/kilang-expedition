import type { Metadata } from "next";
import { requirePage } from "@/lib/admin-auth";
import { SummitTracker } from "@/components/admin/summit-tracker";

export const metadata: Metadata = { title: "Summit tracker" };

export default async function TrackerPage() {
  await requirePage("checkin", "/admin/tracker");
  return <SummitTracker />;
}
