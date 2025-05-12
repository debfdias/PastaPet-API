-- CreateTable
CREATE TABLE "VaccineRecord" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "vaccineTypeId" TEXT NOT NULL,
    "administrationDate" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "lotNumber" TEXT,
    "administeredBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaccineRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaccineType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "diseaseCovered" TEXT[],
    "isCore" BOOLEAN NOT NULL,
    "boosterRequired" BOOLEAN NOT NULL,
    "boosterIntervalMonths" INTEGER,
    "totalRequiredDoses" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaccineType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VaccineRecord_petId_idx" ON "VaccineRecord"("petId");

-- CreateIndex
CREATE INDEX "VaccineRecord_vaccineTypeId_idx" ON "VaccineRecord"("vaccineTypeId");

-- AddForeignKey
ALTER TABLE "VaccineRecord" ADD CONSTRAINT "VaccineRecord_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccineRecord" ADD CONSTRAINT "VaccineRecord_vaccineTypeId_fkey" FOREIGN KEY ("vaccineTypeId") REFERENCES "VaccineType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
