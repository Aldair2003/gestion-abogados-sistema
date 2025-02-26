/*
  Warnings:

  - You are about to drop the column `nivelEstudios` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "nivelEstudios",
ADD COLUMN     "is_first_login" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_profile_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nivel_estudios" TEXT NOT NULL DEFAULT 'ESTUDIANTE';
