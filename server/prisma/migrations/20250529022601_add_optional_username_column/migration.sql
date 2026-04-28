-- AlterTable
ALTER TABLE "User" ADD COLUMN     "username" TEXT;

-- Populate username for existing users
-- This assumes email is not null and has an '@'
-- For emails like 'user@example.com', username becomes 'user'
UPDATE "User" SET "username" = split_part("email", '@', 1) WHERE "email" IS NOT NULL AND "email" LIKE '%@%';

-- Make username NOT NULL after populating
-- Ensure all usernames are populated before this step, otherwise it will fail.
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- Add UNIQUE constraint to username
ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE ("username");
