-- CreateEnum
CREATE TYPE "NivelEstudio" AS ENUM ('ESTUDIANTE', 'GRADUADO', 'MAESTRIA');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "domicilio" TEXT,
ADD COLUMN     "matricula" TEXT,
ADD COLUMN     "nivelEstudios" "NivelEstudio",
ADD COLUMN     "perfilCompleto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "universidad" TEXT,
ALTER COLUMN "nombre" DROP NOT NULL,
ALTER COLUMN "cedula" DROP NOT NULL,
ALTER COLUMN "telefono" DROP NOT NULL;
