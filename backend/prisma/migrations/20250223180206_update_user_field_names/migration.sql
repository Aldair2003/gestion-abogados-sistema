/*
  Warnings:

  - You are about to drop the column `is_first_login` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `is_profile_completed` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `nivel_estudios` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_cedula_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "is_first_login",
DROP COLUMN "is_profile_completed",
DROP COLUMN "nivel_estudios",
ADD COLUMN     "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isProfileCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nivelEstudios" TEXT,
ALTER COLUMN "rol" SET DEFAULT 'user',
ALTER COLUMN "universidad" DROP NOT NULL,
ALTER COLUMN "universidad" DROP DEFAULT;
