-- Script de diagnóstico para la tabla credintegral_documents
-- Ejecuta este SQL en el editor SQL de Supabase para diagnosticar el problema

-- 1. Verificar si la tabla existe
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'credintegral_documents';

-- 2. Verificar la estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'credintegral_documents'
ORDER BY ordinal_position;

-- 3. Contar documentos en la tabla
SELECT 
  'Total documentos' as descripcion,
  count(*) as cantidad 
FROM credintegral_documents;

-- 4. Ver algunos ejemplos de documentos (si existen)
SELECT 
  id, 
  substring(content, 1, 100) as content_preview,
  metadata,
  created_at,
  CASE 
    WHEN embedding IS NULL THEN 'NULL'
    ELSE 'Embedding present'
  END as embedding_status
FROM credintegral_documents 
LIMIT 5;

-- 5. Verificar si la función de búsqueda híbrida existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'search_credintegral_documents_hybrid';

-- 6. Verificar si la función match_credintegral_documents existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'match_credintegral_documents';

-- 7. Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'credintegral_documents';

-- 8. Verificar extensión vector
SELECT * FROM pg_extension WHERE extname = 'vector';
