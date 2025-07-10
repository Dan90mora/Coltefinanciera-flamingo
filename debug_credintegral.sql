-- Script para verificar embeddings y funciones en credintegral_documents
-- Ejecutar en el editor SQL de Supabase

-- 1. Verificar embeddings en los documentos
SELECT 
  id,
  CASE 
    WHEN embedding IS NULL THEN 'NULL'
    ELSE 'PRESENT (' || array_length(embedding, 1) || ' dims)'
  END as embedding_status,
  substring(content, 1, 50) as content_preview
FROM credintegral_documents 
ORDER BY id
LIMIT 5;

-- 2. Contar documentos con y sin embeddings
SELECT 
  'Con embeddings' as tipo,
  COUNT(*) as cantidad
FROM credintegral_documents 
WHERE embedding IS NOT NULL
UNION ALL
SELECT 
  'Sin embeddings' as tipo,
  COUNT(*) as cantidad
FROM credintegral_documents 
WHERE embedding IS NULL;

-- 3. Verificar que existe la función híbrida
SELECT 
  proname,
  pronargs,
  proargnames
FROM pg_proc 
WHERE proname = 'search_credintegral_documents_hybrid';

-- 4. Verificar que existe la función match
SELECT 
  proname,
  pronargs,
  proargnames
FROM pg_proc 
WHERE proname = 'match_credintegral_documents';

-- 5. Buscar contenido que contenga "credintegral" o "seguro"
SELECT 
  id,
  substring(content, 1, 100) as preview,
  metadata
FROM credintegral_documents 
WHERE 
  content ILIKE '%credintegral%' 
  OR content ILIKE '%seguro%'
  OR content ILIKE '%propuesta%'
  OR content ILIKE '%precio%'
LIMIT 3;
