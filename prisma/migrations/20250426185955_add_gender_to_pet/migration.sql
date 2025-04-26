/*
  Warnings:

  - Added the required column `gender` to the `Pet` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PetGender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN "gender" "PetGender" NOT NULL DEFAULT 'MALE';

-- Remove the default after adding the column
ALTER TABLE "Pet" ALTER COLUMN "gender" DROP DEFAULT;
