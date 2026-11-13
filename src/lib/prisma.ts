import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Database client (PostgreSQL through the `pg` driver adapter).
 *
 * On Vercel, DATABASE_URL is the pooled Neon connection string, which suits
 * serverless functions that open many short-lived connections.
 */
export function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Created on first use, so importing this module never needs DATABASE_URL
// (e.g. while Next.js collects page data at build time).
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = (globalForPrisma.prisma ??= createPrismaClient());
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
