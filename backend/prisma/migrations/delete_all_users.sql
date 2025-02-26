-- Primero eliminamos las relaciones
DELETE FROM "UserPermission";
DELETE FROM "ActivityLog";
DELETE FROM "Notification";

-- Luego eliminamos todos los usuarios
DELETE FROM "User";

-- Reiniciamos la secuencia del id
ALTER SEQUENCE "User_id_seq" RESTART WITH 1; 