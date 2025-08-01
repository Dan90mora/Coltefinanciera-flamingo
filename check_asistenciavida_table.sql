-- Script para verificar si la tabla asistenciavida_documents existe y está configurada correctamente
-- Ejecutar en el editor SQL de Supabase

-- 1. Verificar si la tabla existe
SELECT 
  'Tabla encontrada' as status,
  COUNT(*) as total_documents 
FROM asistenciavida_documents;

-- 2. Verificar estructura de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'asistenciavida_documents'
ORDER BY ordinal_position;

-- 3. Verificar si existen embeddings (vectores)
SELECT 
  id,
  CASE 
    WHEN embedding IS NULL THEN 'Sin embedding'
    ELSE 'Con embedding'
  END as embedding_status,
  LENGTH(content) as content_length
FROM asistenciavida_documents 
LIMIT 5;

-- 4. Verificar si existe la función de búsqueda híbrida
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'search_asistenciavida_documents_hybrid';

-- 5. Verificar si existe la función de búsqueda básica
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'match_asistenciavida_documents';
