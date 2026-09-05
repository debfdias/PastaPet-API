-- CreateEnum
CREATE TYPE "FivFelvStatus" AS ENUM ('NOT_TESTED', 'NEGATIVE', 'POSITIVE');

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "felvStatus" "FivFelvStatus" NOT NULL DEFAULT 'NOT_TESTED',
ADD COLUMN     "fivStatus" "FivFelvStatus" NOT NULL DEFAULT 'NOT_TESTED';
