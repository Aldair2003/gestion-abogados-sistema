/*
  Warnings:

  - The `rol` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `nivelEstudios` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "rol",
ADD COLUMN     "rol" "UserRole" NOT NULL DEFAULT 'COLABORADOR',
DROP COLUMN "nivelEstudios",
ADD COLUMN     "nivelEstudios" "NivelEstudio";
