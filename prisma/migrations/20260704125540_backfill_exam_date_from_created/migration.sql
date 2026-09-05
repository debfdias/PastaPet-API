-- Backfill examDate from createdAt for Exam rows created before examDate existed.
-- (Restored file: this migration was already applied in the database.)
UPDATE "Exam" SET "examDate" = "createdAt";
