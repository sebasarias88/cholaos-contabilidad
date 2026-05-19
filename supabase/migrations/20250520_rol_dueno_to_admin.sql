-- Migrar rol 'dueno' → 'admin' en bases de datos existentes
-- Ejecutar en el SQL Editor de Supabase

ALTER TYPE public.rol RENAME VALUE 'dueno' TO 'admin';
