-- Session revocation: tokens carry this number; bumping it signs the user out everywhere.
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
