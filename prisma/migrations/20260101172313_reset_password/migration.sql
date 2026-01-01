-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "passwordResetTokenExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetTokenUsed" BOOLEAN NOT NULL DEFAULT false;
