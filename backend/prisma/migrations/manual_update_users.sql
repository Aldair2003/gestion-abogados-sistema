-- Actualizar registros existentes con valores por defecto
UPDATE "User"
SET 
  "universidad" = COALESCE("universidad", ''),
  "nivelEstudios" = 'ESTUDIANTE'
WHERE "universidad" IS NULL OR "nivelEstudios" IS NULL;

-- Eliminar usuarios sin cédula o con cédula vacía
DELETE FROM "User"
WHERE "cedula" IS NULL OR "cedula" = ''; 