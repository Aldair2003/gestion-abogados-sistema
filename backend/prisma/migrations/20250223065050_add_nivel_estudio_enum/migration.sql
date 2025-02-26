/*
  Warnings:

  - The `nivelEstudios` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `nombre` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cedula` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `telefono` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `universidad` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "NivelEstudio" AS ENUM ('ESTUDIANTE', 'GRADUADO', 'MAESTRIA');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "nombre" SET NOT NULL,
ALTER COLUMN "nombre" SET DEFAULT '',
ALTER COLUMN "cedula" SET NOT NULL,
ALTER COLUMN "cedula" SET DEFAULT '',
ALTER COLUMN "telefono" SET NOT NULL,
ALTER COLUMN "telefono" SET DEFAULT '',
ALTER COLUMN "universidad" SET NOT NULL,
ALTER COLUMN "universidad" SET DEFAULT '',
DROP COLUMN "nivelEstudios",
ADD COLUMN     "nivelEstudios" "NivelEstudio" NOT NULL DEFAULT 'ESTUDIANTE';
