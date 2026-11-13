-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "TicketTier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "priceKobo" INTEGER NOT NULL,
    "perks" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "passId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "tierId" TEXT NOT NULL,
    "amountKobo" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "nextOfKinName" TEXT NOT NULL,
    "nextOfKinPhone" TEXT NOT NULL,
    "bloodGroup" TEXT NOT NULL,
    "genotype" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "medicalNotes" TEXT,
    "kitSize" TEXT NOT NULL,
    "waiverAcceptedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paystackTxId" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "smsSentAt" TIMESTAMP(3),
    "medicalCheckedAt" TIMESTAMP(3),
    "musterCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Registration_reference_key" ON "Registration"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_accessToken_key" ON "Registration"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_passId_key" ON "Registration"("passId");

-- CreateIndex
CREATE INDEX "Registration_fullName_idx" ON "Registration"("fullName");

-- CreateIndex
CREATE INDEX "Registration_email_idx" ON "Registration"("email");

-- CreateIndex
CREATE INDEX "Registration_phone_idx" ON "Registration"("phone");

-- CreateIndex
CREATE INDEX "Registration_status_idx" ON "Registration"("status");

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "TicketTier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

