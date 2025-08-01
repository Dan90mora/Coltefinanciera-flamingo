-- Script para verificar si la tabla asistenciavida_documents y sus funciones existen en Supabase

-- 1. Verificar si la tabla existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'asistenciavida_documents'
) as table_exists;

-- 2. Verificar si hay datos en la tabla (si existe)
SELECT 
    'asistenciavida_documents' as table_name,
    COALESCE(COUNT(*), 0) as record_count
FROM asistenciavida_documents
WHERE true; -- Esta consulta fallará si la tabla no existe

-- 3. Verificar si existen las funciones necesarias
SELECT 
    routine_name,
    routine_type,
    specific_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'match_asistenciavida_documents',
    'search_asistenciavida_documents_hybrid'
)
ORDER BY routine_name;

-- 4. Verificar extensión vector
SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
) as vector_extension_exists;

-- 5. Listar todas las funciones que contienen 'asistenciavida' en el nombre
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%asistenciavida%'
ORDER BY routine_name;
