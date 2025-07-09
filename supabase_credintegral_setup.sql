-- Configuración de base de datos vectorial para documentos de Credintegral
-- Este script crea la tabla y funciones necesarias para almacenar embeddings vectoriales

-- Habilitar la extensión de vectores si no está habilitada
CREATE EXTENSION IF NOT EXISTS vector;

-- Crear tabla para documentos de Credintegral
CREATE TABLE IF NOT EXISTS credintegral_documents (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding vector(1536), -- OpenAI embeddings tienen 1536 dimensiones
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsqueda vectorial eficiente
CREATE INDEX IF NOT EXISTS credintegral_documents_embedding_idx 
ON credintegral_documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Crear índice para metadatos
CREATE INDEX IF NOT EXISTS credintegral_documents_metadata_idx 
ON credintegral_documents 
USING gin (metadata);

-- Eliminar la función si existe para asegurar una recreación limpia
DROP FUNCTION IF EXISTS match_credintegral_documents(vector, double precision, integer);
DROP FUNCTION IF EXISTS match_credintegral_documents(vector, real, integer);
DROP FUNCTION IF EXISTS match_credintegral_documents(vector, float, int);

-- Crear función para búsqueda por similitud
CREATE OR REPLACE FUNCTION match_credintegral_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    credintegral_documents.id,
    credintegral_documents.content,
    credintegral_documents.metadata,
    1 - (credintegral_documents.embedding <=> query_embedding) as similarity
  FROM credintegral_documents
  WHERE 1 - (credintegral_documents.embedding <=> query_embedding) > match_threshold
  ORDER BY credintegral_documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Eliminar la función híbrida si existe para asegurar una recreación limpia
DROP FUNCTION IF EXISTS search_credintegral_documents_hybrid(text, vector, double precision, integer);
DROP FUNCTION IF EXISTS search_credintegral_documents_hybrid(text, vector, real, integer);
DROP FUNCTION IF EXISTS search_credintegral_documents_hybrid(text, vector, float, int);

-- Crear función para búsqueda híbrida (texto + vectorial) con Fusión de Rango Recíproco (RRF)
CREATE OR REPLACE FUNCTION search_credintegral_documents_hybrid(
  query_text text,
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5, -- Umbral de similitud
  match_count int DEFAULT 10,
  rrf_k int DEFAULT 60 -- Parámetro de ponderación para RRF
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  final_rank double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_search AS (
    SELECT 
      cd.id as doc_id,
      ROW_NUMBER() OVER (ORDER BY cd.embedding <=> query_embedding) as rank
    FROM credintegral_documents cd
    WHERE 1 - (cd.embedding <=> query_embedding) > match_threshold
    LIMIT match_count * 2
  ),
  text_search AS (
    SELECT 
      cd.id as doc_id,
      ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('spanish', cd.content), websearch_to_tsquery('spanish', query_text)) DESC) as rank
    FROM credintegral_documents cd
    WHERE to_tsvector('spanish', cd.content) @@ websearch_to_tsquery('spanish', query_text)
    LIMIT match_count * 2
  ),
  combined_results AS (
    SELECT vs.doc_id, 1.0 / (rrf_k + vs.rank) as score FROM vector_search vs
    UNION ALL
    SELECT ts.doc_id, 1.0 / (rrf_k + ts.rank) as score FROM text_search ts
  )
  SELECT 
    cd.id,
    cd.content,
    cd.metadata,
    SUM(cr.score)::double precision as final_rank
  FROM combined_results cr
  JOIN credintegral_documents cd ON cr.doc_id = cd.id
  GROUP BY cd.id, cd.content, cd.metadata
  ORDER BY final_rank DESC
  LIMIT match_count;
END;
$$;

-- Eliminar el trigger si ya existe para evitar errores
DROP TRIGGER IF EXISTS credintegral_documents_updated_at ON credintegral_documents;

-- Eliminar la función del trigger si existe para evitar errores
DROP FUNCTION IF EXISTS update_credintegral_documents_updated_at();

-- Crear trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_credintegral_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER credintegral_documents_updated_at
  BEFORE UPDATE ON credintegral_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_credintegral_documents_updated_at();

-- SECCIÓN DE SEGURIDAD (RLS) - Comentado para que coincida con la configuración de dentix

-- 1. Habilitar Row Level Security en la tabla. Esto es fundamental.
-- ALTER TABLE credintegral_documents ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar CUALQUIER política preexistente para asegurar que no haya acceso anónimo.
-- DROP POLICY IF EXISTS "Enable read access for all users" ON credintegral_documents;
-- DROP POLICY IF EXISTS "Enable access for authenticated users only" ON credintegral_documents; -- Añadido para que el script sea repetible

-- 3. Crear políticas que SOLO permitan el acceso a usuarios autenticados.
-- Esto asegura que el "candado" de RLS aparezca en el panel de Supabase.
-- CREATE POLICY "Enable access for authenticated users only" ON credintegral_documents
--   FOR ALL -- Aplica a SELECT, INSERT, UPDATE, DELETE
--   TO authenticated -- Solo para usuarios que han iniciado sesión
--   USING (true)      -- La condición para las filas que se pueden ver/modificar
--   WITH CHECK (true); -- La condición para las filas que se pueden crear/actualizar

-- Comentarios para documentación
COMMENT ON TABLE credintegral_documents IS 'Almacena documentos de Credintegral como embeddings vectoriales para búsqueda semántica';
COMMENT ON COLUMN credintegral_documents.content IS 'Texto del chunk del documento';
COMMENT ON COLUMN credintegral_documents.metadata IS 'Metadatos del documento (archivo, chunk, etc.)';
COMMENT ON COLUMN credintegral_documents.embedding IS 'Vector embedding del contenido (OpenAI ada-002, 1536 dims)';
COMMENT ON FUNCTION match_credintegral_documents IS 'Busca documentos por similitud vectorial';
COMMENT ON FUNCTION search_credintegral_documents_hybrid IS 'Busca documentos usando similitud vectorial y búsqueda de texto';
