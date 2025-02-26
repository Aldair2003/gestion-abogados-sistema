/*
  Warnings:

  - You are about to drop the column `matricula` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `nivelEstudios` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[numeroMatricula]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EstadoProfesional" AS ENUM ('ESTUDIANTE', 'GRADUADO');

-- DropIndex
DROP INDEX "User_matricula_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "matricula",
DROP COLUMN "nivelEstudios",
ADD COLUMN     "estadoProfesional" "EstadoProfesional",
ADD COLUMN     "numeroMatricula" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_numeroMatricula_key" ON "User"("numeroMatricula");
