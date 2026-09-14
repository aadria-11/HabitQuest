-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "provider" TEXT NOT NULL DEFAULT '',
ADD COLUMN "providerAccountId" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "email" DROP NOT NULL;

-- Update existing rows with placeholder values (will be synced on next login)
UPDATE "User" SET provider = 'unknown', "providerAccountId" = id WHERE provider = '';

-- Add unique constraint
ALTER TABLE "User" ADD CONSTRAINT "User_provider_providerAccountId_key" UNIQUE ("provider", "providerAccountId");

-- Remove the default values now that they're populated
ALTER TABLE "User" ALTER COLUMN "provider" DROP DEFAULT,
ALTER COLUMN "providerAccountId" DROP DEFAULT;
