/*
  Warnings:

  - The values [SYSTEM,USER,SECURITY,AUDIT] on the enum `ActivityCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ActivityCategory_new" AS ENUM ('SESSION', 'PROFILE', 'ADMINISTRATIVE', 'ACCOUNT_STATUS');
ALTER TABLE "ActivityLog" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "ActivityLog" ALTER COLUMN "category" TYPE "ActivityCategory_new" USING ("category"::text::"ActivityCategory_new");
ALTER TYPE "ActivityCategory" RENAME TO "ActivityCategory_old";
ALTER TYPE "ActivityCategory_new" RENAME TO "ActivityCategory";
DROP TYPE "ActivityCategory_old";
ALTER TABLE "ActivityLog" ALTER COLUMN "category" SET DEFAULT 'SESSION';
COMMIT;

-- AlterTable
ALTER TABLE "ActivityLog" ALTER COLUMN "category" SET DEFAULT 'SESSION';
