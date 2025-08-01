-- Script rápido para verificar datos de vida deudor
-- Ejecutar en el editor SQL de Supabase

-- 1. Verificar si la tabla asistenciavida_documents existe
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'asistenciavida_documents';

-- 2. Si existe, contar registros
SELECT 
  'Total documentos' as descripcion,
  count(*) as cantidad 
FROM asistenciavida_documents;

-- 3. Buscar documentos que contengan texto de tarifas
SELECT 
  id,
  substring(content, 1, 200) as preview,
  metadata
FROM asistenciavida_documents 
WHERE 
  content ILIKE '%tarifa mes%' 
  OR content ILIKE '%tarifa completa%'
  OR content ILIKE '%tarifa propuesta%'
  OR content ILIKE '%vida deudor%'
LIMIT 5;

-- 4. Verificar si existe la función de búsqueda híbrida
SELECT proname 
FROM pg_proc 
WHERE proname = 'search_asistenciavida_documents_hybrid';
