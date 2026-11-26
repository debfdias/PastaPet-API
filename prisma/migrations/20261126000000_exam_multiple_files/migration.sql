-- Exams can now have multiple files. Replace the single `fileUrl` column with a
-- `fileUrls` text array. Backfill existing single URLs into the array before
-- dropping the old column. Runs in a transaction via scripts/migrate.js.
ALTER TABLE "Exam" ADD COLUMN "fileUrls" TEXT[] NOT NULL DEFAULT '{}';
UPDATE "Exam" SET "fileUrls" = ARRAY["fileUrl"] WHERE "fileUrl" IS NOT NULL;
ALTER TABLE "Exam" DROP COLUMN "fileUrl";
