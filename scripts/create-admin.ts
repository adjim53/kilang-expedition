/**
 * Create the first back-office account (or reset an existing one) from the
 * command line. Everyone else is added from /admin/users.
 *
 *   npm run admin:create -- --email you@example.com --name "Your Name"
 *   npm run admin:create -- --email you@example.com --reset     (new temporary password)
 *
 * Prints a temporary password once. It must be changed at first sign-in.
 */
import "dotenv/config";
import { createPrismaClient } from "../src/lib/prisma";
import { generateTemporaryPassword, hashPassword } from "../src/lib/auth/password";
import { isRole } from "../src/lib/auth/roles";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim();
  const role = arg("role")?.toUpperCase() ?? "ADMIN";
  const reset = process.argv.includes("--reset");

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Give a valid --email");
  if (!isRole(role)) throw new Error("--role must be ADMIN, STAFF or MARSHAL");

  const prisma = createPrismaClient();
  try {
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    if (existing) {
      if (!reset) throw new Error(`${email} already exists. Add --reset to give it a new temporary password.`);
      await prisma.adminUser.update({ where: { email }, data: { passwordHash, mustChangePassword: true, active: true } });
      await prisma.adminSession.deleteMany({ where: { userId: existing.id } });
      console.log(`Reset password for ${existing.name} <${email}> (${existing.role}).`);
    } else {
      if (!name) throw new Error("Give a --name for the new account");
      await prisma.adminUser.create({ data: { email, name, role, passwordHash, mustChangePassword: true } });
      console.log(`Created ${role} account for ${name} <${email}>.`);
    }
    console.log(`\nTemporary password (shown once): ${temporaryPassword}\n`);
    console.log("Sign in at /admin/login — you will be asked to choose your own password.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
