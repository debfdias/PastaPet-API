-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "hasFuneraryPlan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasPetPlan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "petPlanName" TEXT;
