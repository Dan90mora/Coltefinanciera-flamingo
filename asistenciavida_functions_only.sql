-- Solo las funciones necesarias para asistenciavida_documents (tabla ya existe)
-- Ejecutar en el editor SQL de Supabase

-- Eliminar funciones si existen para asegurar una recreación limpia
DROP FUNCTION IF EXISTS match_asistenciavida_documents(vector, double precision, integer);
DROP FUNCTION IF EXISTS match_asistenciavida_documents(vector, real, integer);
DROP FUNCTION IF EXISTS match_asistenciavida_documents(vector, float, int);

-- Crear función para búsqueda por similitud
CREATE OR REPLACE FUNCTION match_asistenciavida_documents(
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
    asistenciavida_documents.id,
    asistenciavida_documents.content,
    asistenciavida_documents.metadata,
    1 - (asistenciavida_documents.embedding <=> query_embedding) as similarity
  FROM asistenciavida_documents
  WHERE 1 - (asistenciavida_documents.embedding <=> query_embedding) > match_threshold
  ORDER BY asistenciavida_documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Eliminar la función híbrida si existe
DROP FUNCTION IF EXISTS search_asistenciavida_documents_hybrid(text, vector, double precision, integer);
DROP FUNCTION IF EXISTS search_asistenciavida_documents_hybrid(text, vector, real, integer);
DROP FUNCTION IF EXISTS search_asistenciavida_documents_hybrid(text, vector, float, int);

-- Crear función para búsqueda híbrida (texto + vectorial) con RRF
CREATE OR REPLACE FUNCTION search_asistenciavida_documents_hybrid(
  query_text text,
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  rrf_k int DEFAULT 60
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
      avd.id as doc_id,
      ROW_NUMBER() OVER (ORDER BY avd.embedding <=> query_embedding) as rank
    FROM asistenciavida_documents avd
    WHERE 1 - (avd.embedding <=> query_embedding) > match_threshold
    LIMIT match_count * 2
  ),
  text_search AS (
    SELECT 
      avd.id as doc_id,
      ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('spanish', avd.content), websearch_to_tsquery('spanish', query_text)) DESC) as rank
    FROM asistenciavida_documents avd
    WHERE to_tsvector('spanish', avd.content) @@ websearch_to_tsquery('spanish', query_text)
    LIMIT match_count * 2
  ),
  combined_results AS (
    SELECT vs.doc_id, 1.0 / (rrf_k + vs.rank) as score FROM vector_search vs
    UNION ALL
    SELECT ts.doc_id, 1.0 / (rrf_k + ts.rank) as score FROM text_search ts
  )
  SELECT 
    avd.id,
    avd.content,
    avd.metadata,
    SUM(cr.score)::double precision as final_rank
  FROM combined_results cr
  JOIN asistenciavida_documents avd ON cr.doc_id = avd.id
  GROUP BY avd.id, avd.content, avd.metadata
  ORDER BY final_rank DESC
  LIMIT match_count;
END;
$$;
