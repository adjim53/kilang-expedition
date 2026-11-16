import { prisma } from "./prisma";

/**
 * Fixed-window rate limit stored in the database, so it holds across
 * serverless instances. Returns true while the caller is under the limit.
 */
export async function hit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = new Date();
  try {
    const row = await prisma.$transaction(async (tx) => {
      const current = await tx.rateLimit.findUnique({ where: { key } });
      if (!current || current.resetAt <= now) {
        return tx.rateLimit.upsert({
          where: { key },
          create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
          update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
        });
      }
      return tx.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    });
    return row.count <= limit;
  } catch (err) {
    // Fail open: a database hiccup must not lock everyone out, and the
    // protected actions have their own checks.
    console.error("[rate-limit] failed", err);
    return true;
  }
}

/** True if the key is already over the limit, without counting this call. */
export async function isLimited(key: string, limit: number): Promise<boolean> {
  try {
    const row = await prisma.rateLimit.findUnique({ where: { key } });
    return Boolean(row && row.resetAt > new Date() && row.count >= limit);
  } catch {
    return false;
  }
}

export async function clearLimit(key: string) {
  await prisma.rateLimit.delete({ where: { key } }).catch(() => {});
}

/**
 * Client IP. On Vercel, x-forwarded-for is set by the platform and its first
 * entry is the real client. Elsewhere, put the site behind a proxy that does the same.
 */
export function clientIp(request: Request) {
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}
