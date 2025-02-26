/*
  Warnings:

  - You are about to drop the column `description` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `lastLogin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenExpiry` on the `User` table. All the data in the column will be lost.
  - The `rol` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `nivelEstudios` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[matricula]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ActivityLog_action_idx";

-- DropIndex
DROP INDEX "ActivityLog_userId_idx";

-- AlterTable
ALTER TABLE "ActivityLog" DROP COLUMN "description",
DROP COLUMN "ipAddress",
DROP COLUMN "userAgent",
ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastLogin",
DROP COLUMN "resetToken",
DROP COLUMN "resetTokenExpiry",
ALTER COLUMN "nombre" DROP NOT NULL,
ALTER COLUMN "nombre" DROP DEFAULT,
ALTER COLUMN "cedula" DROP NOT NULL,
ALTER COLUMN "telefono" DROP NOT NULL,
ALTER COLUMN "telefono" DROP DEFAULT,
DROP COLUMN "rol",
ADD COLUMN     "rol" TEXT NOT NULL DEFAULT 'COLABORADOR',
DROP COLUMN "nivelEstudios",
ADD COLUMN     "nivelEstudios" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE UNIQUE INDEX "User_matricula_key" ON "User"("matricula");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
