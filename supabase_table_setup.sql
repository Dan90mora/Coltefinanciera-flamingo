-- Configuración de la tabla dentix_documents en Supabase
-- Ejecuta este SQL en el editor SQL de tu dashboard de Supabase

-- Habilitar la extensión vector (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS vector;

-- Eliminar tabla existente si existe (solo para limpieza)
DROP TABLE IF EXISTS dentix_documents CASCADE;

-- Crear la tabla dentix_documents
CREATE TABLE dentix_documents (
  id bigserial PRIMARY KEY,
  content text NOT NULL,
  metadata jsonb,
  embedding vector(1536), -- Dimensión para text-embedding-3-small
  created_at timestamptz DEFAULT now()
);

-- Crear función para búsqueda de similitud vectorial
CREATE OR REPLACE FUNCTION match_dentix_documents (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN query
  SELECT
    dentix_documents.id,
    dentix_documents.content,
    dentix_documents.metadata,
    1 - (dentix_documents.embedding <=> query_embedding) AS similarity
  FROM dentix_documents
  WHERE 1 - (dentix_documents.embedding <=> query_embedding) > match_threshold
  ORDER BY dentix_documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Crear índice para mejorar la velocidad de búsqueda vectorial
CREATE INDEX IF NOT EXISTS dentix_documents_embedding_idx 
ON dentix_documents USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Habilitar Row Level Security (RLS) si es necesario
-- ALTER TABLE dentix_documents ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir todas las operaciones (ajustar según necesidades de seguridad)
-- CREATE POLICY "Allow all operations on dentix_documents" ON dentix_documents FOR ALL USING (true);

-- Verificar que todo esté creado correctamente
SELECT 
  'Tabla creada correctamente' as status,
  count(*) as total_documents 
FROM dentix_documents;
