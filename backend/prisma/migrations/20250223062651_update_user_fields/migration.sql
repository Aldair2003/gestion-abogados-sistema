/*
  Warnings:

  - You are about to drop the column `perfilCompleto` on the `User` table. All the data in the column will be lost.
  - The `nivelEstudios` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "perfilCompleto",
DROP COLUMN "nivelEstudios",
ADD COLUMN     "nivelEstudios" TEXT;
