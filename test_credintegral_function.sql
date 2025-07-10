-- Script de prueba para la función search_credintegral_documents_hybrid
-- Ejecuta este SQL paso a paso en el editor SQL de Supabase

-- 1. Verificar que existe la función
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'search_credintegral_documents_hybrid';

-- 2. Ver los primeros documentos para entender el contenido
SELECT 
  id, 
  substring(content, 1, 200) as content_preview,
  metadata,
  CASE 
    WHEN embedding IS NULL THEN 'NULL'
    ELSE 'Embedding present (' || array_length(embedding::real[], 1) || ' dims)'
  END as embedding_info
FROM credintegral_documents 
ORDER BY id
LIMIT 3;

-- 3. Probar búsqueda de texto simple
SELECT 
  id,
  substring(content, 1, 100) as preview
FROM credintegral_documents 
WHERE content ILIKE '%credintegral%' OR content ILIKE '%seguro%'
LIMIT 3;

-- 4. Verificar si hay embeddings válidos
SELECT 
  COUNT(*) as total_docs,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as docs_with_embeddings,
  COUNT(CASE WHEN embedding IS NULL THEN 1 END) as docs_without_embeddings
FROM credintegral_documents;

-- 5. Probar la función match_credintegral_documents (función básica)
-- NOTA: Esta requiere un embedding real, así que solo verificamos que existe
SELECT proname 
FROM pg_proc 
WHERE proname = 'match_credintegral_documents';
