-- Script para deshabilitar Row Level Security en la tabla credintegral_documents
-- Esto permitirá acceso completo a la tabla sin restricciones de políticas

-- Deshabilitar Row Level Security
ALTER TABLE credintegral_documents DISABLE ROW LEVEL SECURITY;

-- Opcional: Eliminar las políticas existentes si quieres limpiar completamente
DROP POLICY IF EXISTS "Enable read access for all users" ON credintegral_documents;
DROP POLICY IF EXISTS "Enable insert access for all users" ON credintegral_documents;

-- Comentario de confirmación
COMMENT ON TABLE credintegral_documents IS 'Almacena documentos de Credintegral como embeddings vectoriales para búsqueda semántica - RLS DESHABILITADO';

-- Verificar el estado (este comando es solo informativo)
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename = 'credintegral_documents';
