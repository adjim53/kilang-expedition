/**
 * Prisma 7 configuration. Connection strings live here, not in schema.prisma.
 *
 * The CLI (migrate, studio) uses the direct, non-pooled connection when one is
 * set — Neon's pooler doesn't support everything migrations need. The running
 * site connects through the driver adapter in src/lib/prisma.ts instead.
 */
import "dotenv/config";
import { defineConfig } from "prisma/config";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Optional so `prisma generate` (run on npm install) works without a database.
  ...(url ? { datasource: { url } } : {}),
});
