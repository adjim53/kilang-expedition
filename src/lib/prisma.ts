import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

/**
 * Database client.
 *
 * SQLite is reached through the libSQL driver adapter. Relative `file:` URLs
 * are resolved against the /prisma folder — the same place `prisma db push`
 * creates the database — so `DATABASE_URL="file:./dev.db"` means prisma/dev.db
 * everywhere.
 *
 * Moving to PostgreSQL / Supabase:
 *   1. prisma/schema.prisma → provider = "postgresql"
 *   2. npm i @prisma/adapter-pg pg   (and remove @prisma/adapter-libsql)
 *   3. Replace the adapter below with:
 *        new PrismaPg({ connectionString: process.env.DATABASE_URL })
 */
function databaseUrl() {
  const url = process.env.DATABASE_URL || "file:./dev.db";
  if (!url.startsWith("file:")) return url;
  const file = url.slice("file:".length);
  if (path.isAbsolute(file)) return url;
  return `file:${path.join(process.cwd(), "prisma", file)}`;
}

export function createPrismaClient() {
  return new PrismaClient({ adapter: new PrismaLibSQL({ url: databaseUrl() }) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
