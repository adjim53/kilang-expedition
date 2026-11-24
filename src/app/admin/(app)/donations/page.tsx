import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePage } from "@/lib/admin-auth";
import { DonationsTable } from "@/components/admin/donations-table";

export const metadata: Metadata = { title: "Donations" };

export default async function DonationsPage() {
  await requirePage("donations.view", "/admin/donations");
  return (
    <Suspense>
      <DonationsTable />
    </Suspense>
  );
}
