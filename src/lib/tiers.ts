import { DEFAULT_TIERS, type Tier } from "@/data/tiers";
import { prisma } from "./prisma";

function parsePerks(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/** Active tiers from the database; falls back to the defaults if the DB is empty or unreachable. */
export async function getTiers(): Promise<Tier[]> {
  try {
    const rows = await prisma.ticketTier.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    if (rows.length === 0) return DEFAULT_TIERS;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      tagline: r.tagline,
      priceKobo: r.priceKobo,
      perks: parsePerks(r.perks),
      featured: r.featured,
      sortOrder: r.sortOrder,
    }));
  } catch {
    return DEFAULT_TIERS;
  }
}
