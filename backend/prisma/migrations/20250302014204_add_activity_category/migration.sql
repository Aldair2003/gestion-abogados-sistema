-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('SYSTEM', 'USER', 'SECURITY', 'AUDIT');

-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "category" "ActivityCategory" NOT NULL DEFAULT 'SYSTEM';
