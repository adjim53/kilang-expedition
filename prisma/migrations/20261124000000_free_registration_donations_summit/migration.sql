-- Registration is now free: ticket tiers and registration payments are removed.
-- Paystack is used for donations instead. Summit tracking gains two checkpoints.

-- New columns: summit checkpoints, and a text copy of the ticket earlier payers bought.
ALTER TABLE "Registration" ADD COLUMN     "legacyTicket" TEXT,
ADD COLUMN     "summitReachedAt" TIMESTAMP(3),
ADD COLUMN     "summitReachedBy" TEXT,
ADD COLUMN     "descentCheckedAt" TIMESTAMP(3),
ADD COLUMN     "descentCheckedBy" TEXT;

-- Keep a record of what was bought before the tiers go.
UPDATE "Registration" AS r
SET "legacyTicket" = t."name"
FROM "TicketTier" AS t
WHERE t."id" = r."tierId" AND r."paidAt" IS NOT NULL;

-- Unpaid rows never owed anything now; keep the amount only where money was received.
UPDATE "Registration" SET "amountKobo" = 0 WHERE "paidAt" IS NULL;

-- Everyone who had a confirmed place keeps it under the new status name.
UPDATE "Registration" SET "status" = 'REGISTERED' WHERE "status" = 'PAID';

-- DropForeignKey
ALTER TABLE "Registration" DROP CONSTRAINT "Registration_tierId_fkey";

-- AlterTable
ALTER TABLE "Registration" DROP COLUMN "tierId",
ALTER COLUMN "amountKobo" SET DEFAULT 0;

-- DropTable
DROP TABLE "TicketTier";

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amountKobo" INTEGER NOT NULL,
    "donorType" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "organisation" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "paidAt" TIMESTAMP(3),
    "paystackTxId" TEXT,
    "receiptSentAt" TIMESTAMP(3),
    "receiptError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Donation_reference_key" ON "Donation"("reference");

-- CreateIndex
CREATE INDEX "Donation_status_idx" ON "Donation"("status");

-- CreateIndex
CREATE INDEX "Donation_createdAt_idx" ON "Donation"("createdAt");
