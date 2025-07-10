-- Script para vaciar la tabla credintegral_documents
-- Ejecutar en el editor SQL de Supabase

-- ⚠️ ATENCIÓN: Esto eliminará TODOS los documentos de Credintegral
-- Asegúrate de tener una copia de respaldo si es necesario

-- OPCIÓN 1: DELETE (conserva estructura, trigger y secuencias)
DELETE FROM credintegral_documents;

-- OPCIÓN 2: TRUNCATE (más eficiente, reinicia secuencias)
-- TRUNCATE TABLE credintegral_documents RESTART IDENTITY;

-- Verificar que la tabla quedó vacía
SELECT 
  'Tabla vacía' as status,
  COUNT(*) as total_documents 
FROM credintegral_documents;

-- Mostrar estructura de la tabla para confirmar que está intacta
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'credintegral_documents'
ORDER BY ordinal_position;
