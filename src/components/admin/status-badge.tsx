import { Badge } from "@/components/ui/badge";

const STYLES: Record<string, { label: string; variant: "forest" | "sand" | "warn" | "gold" | "soft" }> = {
  PAID: { label: "Paid", variant: "forest" },
  PENDING: { label: "Awaiting payment", variant: "sand" },
  FAILED: { label: "Payment failed", variant: "warn" },
  CANCELLED: { label: "Cancelled", variant: "warn" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STYLES[status] ?? { label: status, variant: "sand" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(STYLES).map(([k, v]) => [k, v.label]),
);
