-- Script para verificar qué tablas y funciones están disponibles en Supabase
-- Ejecutar en el editor SQL de Supabase para ver qué hay actualmente

-- 1. Verificar tablas de documentos existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%documents'
ORDER BY table_name;

-- 2. Verificar funciones RPC existentes
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_name LIKE '%documents%'
   OR routine_name LIKE 'search_%'
   OR routine_name LIKE 'match_%'
ORDER BY routine_name;

-- 3. Verificar si existe bienestarplus_documents
SELECT 
  'bienestarplus_documents' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'bienestarplus_documents'
    ) THEN 'EXISTS'
    ELSE 'NOT EXISTS'
  END as status;

-- 4. Verificar funciones específicas de bienestar plus
SELECT 
  'search_bienestarplus_documents_hybrid' as function_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'search_bienestarplus_documents_hybrid'
    ) THEN 'EXISTS'
    ELSE 'NOT EXISTS'
  END as status
UNION ALL
SELECT 
  'match_bienestarplus_documents' as function_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'match_bienestarplus_documents'
    ) THEN 'EXISTS'
    ELSE 'NOT EXISTS'
  END as status;

-- 5. Contar documentos en todas las tablas de documentos (si existen)
DO $$
DECLARE
    table_record RECORD;
    count_result INT;
    sql_query TEXT;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE '%documents'
    LOOP
        sql_query := 'SELECT COUNT(*) FROM ' || table_record.table_name;
        EXECUTE sql_query INTO count_result;
        RAISE NOTICE 'Tabla %: % documentos', table_record.table_name, count_result;
    END LOOP;
END $$;
