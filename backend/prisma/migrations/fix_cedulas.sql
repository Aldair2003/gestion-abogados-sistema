-- Actualizar registros con cédula vacía
UPDATE "User"
SET "cedula" = 'TEMP_' || id::text
WHERE "cedula" = ''; 