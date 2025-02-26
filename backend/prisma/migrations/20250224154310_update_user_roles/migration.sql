/*
  Warnings:

  - You are about to drop the column `lastLoginAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `loginCount` on the `User` table. All the data in the column will be lost.
  - The `rol` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `nivelEstudios` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[cedula]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `modulo` to the `Permission` table without a default value. This is not possible if the table is not empty.
  - Made the column `descripcion` on table `Permission` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'COLABORADOR');

-- AlterTable
ALTER TABLE "Permission" ADD COLUMN     "modulo" TEXT NOT NULL,
ALTER COLUMN "descripcion" SET NOT NULL;

-- AlterTable
ALTER TABLE "Province" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastLoginAt",
DROP COLUMN "loginCount",
DROP COLUMN "rol",
ADD COLUMN     "rol" "UserRole" NOT NULL DEFAULT 'COLABORADOR',
DROP COLUMN "nivelEstudios",
ADD COLUMN     "nivelEstudios" "NivelEstudio";

-- CreateIndex
CREATE UNIQUE INDEX "User_cedula_key" ON "User"("cedula");
