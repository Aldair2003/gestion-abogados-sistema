-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "loginCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");
