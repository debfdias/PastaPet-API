-- CreateEnum
CREATE TYPE "SymptomType" AS ENUM ('VOMITING', 'DIARRHEA', 'APPETITE_LOSS', 'LETHARGY', 'COUGHING', 'SNEEZING', 'ITCHING', 'LIMPING', 'SEIZURE', 'OTHER');

-- CreateTable
CREATE TABLE "Symptom" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SymptomType" NOT NULL,
    "severity" "NoteSeverity" NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Symptom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeightEntry" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeightEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportShare" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Symptom_petId_idx" ON "Symptom"("petId");

-- CreateIndex
CREATE INDEX "Symptom_userId_idx" ON "Symptom"("userId");

-- CreateIndex
CREATE INDEX "WeightEntry_petId_idx" ON "WeightEntry"("petId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportShare_token_key" ON "ReportShare"("token");

-- CreateIndex
CREATE INDEX "ReportShare_petId_idx" ON "ReportShare"("petId");

-- CreateIndex
CREATE INDEX "ReportShare_token_idx" ON "ReportShare"("token");

-- AddForeignKey
ALTER TABLE "Symptom" ADD CONSTRAINT "Symptom_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Symptom" ADD CONSTRAINT "Symptom_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeightEntry" ADD CONSTRAINT "WeightEntry_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportShare" ADD CONSTRAINT "ReportShare_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: seed each pet's current weight as its first weight-history point,
-- timestamped to when that weight value was last set (Pet.updatedAt).
INSERT INTO "WeightEntry" ("id", "petId", "weight", "measuredAt", "createdAt")
SELECT gen_random_uuid()::text, "id", "weight", "updatedAt", CURRENT_TIMESTAMP
FROM "Pet";
