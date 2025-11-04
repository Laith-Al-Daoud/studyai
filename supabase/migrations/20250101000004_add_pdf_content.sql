-- Add PDF text content and vector embeddings support
-- This enables RAG (Retrieval-Augmented Generation)

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add text_content column to store extracted PDF text
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS text_content TEXT,
ADD COLUMN IF NOT EXISTS text_extracted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'pending';

-- Add comment
COMMENT ON COLUMN files.text_content IS 'Extracted text content from PDF file';
COMMENT ON COLUMN files.text_extracted_at IS 'Timestamp when text was extracted';
COMMENT ON COLUMN files.extraction_status IS 'Status: pending, processing, completed, failed';

-- Create a new table for PDF chunks (for better RAG performance)
CREATE TABLE IF NOT EXISTS public.pdf_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding vector(1536), -- OpenAI/Gemini embedding dimension
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pdf_chunks_file_id ON public.pdf_chunks(file_id);
CREATE INDEX idx_pdf_chunks_chapter_id ON public.pdf_chunks(chapter_id);
CREATE INDEX idx_pdf_chunks_embedding ON public.pdf_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Add comments
COMMENT ON TABLE public.pdf_chunks IS 'PDF text chunks with embeddings for RAG retrieval';
COMMENT ON COLUMN public.pdf_chunks.chunk_text IS 'Text chunk from PDF (500-1000 chars)';
COMMENT ON COLUMN public.pdf_chunks.embedding IS 'Vector embedding for semantic search';
COMMENT ON COLUMN public.pdf_chunks.chunk_index IS 'Order of chunk in original document';

-- Function to search for relevant chunks using cosine similarity
CREATE OR REPLACE FUNCTION match_pdf_chunks(
  query_embedding vector(1536),
  match_chapter_id uuid,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  file_id uuid,
  chunk_text text,
  chunk_index integer,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pdf_chunks.id,
    pdf_chunks.file_id,
    pdf_chunks.chunk_text,
    pdf_chunks.chunk_index,
    1 - (pdf_chunks.embedding <=> query_embedding) as similarity
  FROM pdf_chunks
  WHERE pdf_chunks.chapter_id = match_chapter_id
    AND 1 - (pdf_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY pdf_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_pdf_chunks IS 'Search for relevant PDF chunks using vector similarity';


