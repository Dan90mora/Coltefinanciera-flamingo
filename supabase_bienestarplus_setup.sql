-- Configuración de base de datos vectorial para documentos de Bienestar Plus
-- Este script crea la tabla y funciones necesarias para almacenar embeddings vectoriales

-- Habilitar la extensión de vectores si no está habilitada
CREATE EXTENSION IF NOT EXISTS vector;

-- Crear tabla para documentos de Bienestar Plus
CREATE TABLE IF NOT EXISTS bienestarplus_documents (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding vector(1536), -- OpenAI embeddings tienen 1536 dimensiones
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsqueda vectorial eficiente
CREATE INDEX IF NOT EXISTS bienestarplus_documents_embedding_idx 
ON bienestarplus_documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Crear índice para metadatos
CREATE INDEX IF NOT EXISTS bienestarplus_documents_metadata_idx 
ON bienestarplus_documents 
USING gin (metadata);

-- Eliminar la función si existe para asegurar una recreación limpia
DROP FUNCTION IF EXISTS match_bienestarplus_documents(vector, double precision, integer);
DROP FUNCTION IF EXISTS match_bienestarplus_documents(vector, real, integer);
DROP FUNCTION IF EXISTS match_bienestarplus_documents(vector, float, int);

-- Crear función para búsqueda por similitud
CREATE OR REPLACE FUNCTION match_bienestarplus_documents(
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
    bienestarplus_documents.id,
    bienestarplus_documents.content,
    bienestarplus_documents.metadata,
    1 - (bienestarplus_documents.embedding <=> query_embedding) as similarity
  FROM bienestarplus_documents
  WHERE 1 - (bienestarplus_documents.embedding <=> query_embedding) > match_threshold
  ORDER BY bienestarplus_documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Eliminar la función híbrida si existe para asegurar una recreación limpia
DROP FUNCTION IF EXISTS search_bienestarplus_documents_hybrid(text, vector, double precision, integer);
DROP FUNCTION IF EXISTS search_bienestarplus_documents_hybrid(text, vector, real, integer);
DROP FUNCTION IF EXISTS search_bienestarplus_documents_hybrid(text, vector, float, int);

-- Crear función para búsqueda híbrida (texto + vectorial) con Fusión de Rango Recíproco (RRF)
CREATE OR REPLACE FUNCTION search_bienestarplus_documents_hybrid(
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
      bd.id as doc_id,
      ROW_NUMBER() OVER (ORDER BY bd.embedding <=> query_embedding) as rank
    FROM bienestarplus_documents bd
    WHERE 1 - (bd.embedding <=> query_embedding) > match_threshold
    LIMIT match_count * 2
  ),
  text_search AS (
    SELECT 
      bd.id as doc_id,
      ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('spanish', bd.content), websearch_to_tsquery('spanish', query_text)) DESC) as rank
    FROM bienestarplus_documents bd
    WHERE to_tsvector('spanish', bd.content) @@ websearch_to_tsquery('spanish', query_text)
    LIMIT match_count * 2
  ),
  combined_results AS (
    SELECT vs.doc_id, 1.0 / (rrf_k + vs.rank) as score FROM vector_search vs
    UNION ALL
    SELECT ts.doc_id, 1.0 / (rrf_k + ts.rank) as score FROM text_search ts
  )
  SELECT 
    bd.id,
    bd.content,
    bd.metadata,
    SUM(cr.score)::double precision as final_rank
  FROM combined_results cr
  JOIN bienestarplus_documents bd ON cr.doc_id = bd.id
  GROUP BY bd.id, bd.content, bd.metadata
  ORDER BY final_rank DESC
  LIMIT match_count;
END;
$$;

-- Eliminar el trigger si ya existe para evitar errores
DROP TRIGGER IF EXISTS bienestarplus_documents_updated_at ON bienestarplus_documents;

-- Eliminar la función del trigger si existe para evitar errores
DROP FUNCTION IF EXISTS update_bienestarplus_documents_updated_at();

-- Crear trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_bienestarplus_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bienestarplus_documents_updated_at
  BEFORE UPDATE ON bienestarplus_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_bienestarplus_documents_updated_at();

-- SECCIÓN DE SEGURIDAD (RLS) - Comentado para que coincida con la configuración de dentix

-- 1. Habilitar Row Level Security en la tabla. Esto es fundamental.
-- ALTER TABLE bienestarplus_documents ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar CUALQUIER política preexistente para asegurar que no haya acceso anónimo.
-- DROP POLICY IF EXISTS "Enable read access for all users" ON bienestarplus_documents;
-- DROP POLICY IF EXISTS "Enable access for authenticated users only" ON bienestarplus_documents; -- Añadido para que el script sea repetible

-- 3. Crear políticas que SOLO permitan el acceso a usuarios autenticados.
-- Esto asegura que el "candado" de RLS aparezca en el panel de Supabase.
-- CREATE POLICY "Enable access for authenticated users only" ON bienestarplus_documents
--   FOR ALL -- Aplica a SELECT, INSERT, UPDATE, DELETE
--   TO authenticated -- Solo para usuarios que han iniciado sesión
--   USING (true)      -- La condición para las filas que se pueden ver/modificar
--   WITH CHECK (true); -- La condición para las filas que se pueden crear/actualizar

-- Comentarios para documentación
COMMENT ON TABLE bienestarplus_documents IS 'Almacena documentos de Bienestar Plus como embeddings vectoriales para búsqueda semántica';
COMMENT ON COLUMN bienestarplus_documents.content IS 'Texto del chunk del documento';
COMMENT ON COLUMN bienestarplus_documents.metadata IS 'Metadatos del documento (archivo, chunk, etc.)';
COMMENT ON COLUMN bienestarplus_documents.embedding IS 'Vector embedding del contenido (OpenAI ada-002, 1536 dims)';
COMMENT ON FUNCTION match_bienestarplus_documents IS 'Busca documentos por similitud vectorial';
COMMENT ON FUNCTION search_bienestarplus_documents_hybrid IS 'Busca documentos usando similitud vectorial y búsqueda de texto';
