-- Additional Performance Indexes for Common Query Patterns
-- Stage 7: Testing, Optimization & Deployment

-- =====================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- =====================================================

-- Index for fetching subjects with latest chapters
CREATE INDEX IF NOT EXISTS idx_subjects_user_created 
  ON public.subjects(user_id, created_at DESC);

-- Index for fetching chapters with files count
CREATE INDEX IF NOT EXISTS idx_chapters_subject_created 
  ON public.chapters(subject_id, created_at DESC);

-- Index for fetching files with extraction status
CREATE INDEX IF NOT EXISTS idx_files_chapter_status 
  ON public.files(chapter_id, extraction_status);

-- Index for chat history ordered by time
CREATE INDEX IF NOT EXISTS idx_chats_chapter_created 
  ON public.chats(chapter_id, created_at ASC);

-- Index for pdf_chunks lookup by chapter and similarity search
CREATE INDEX IF NOT EXISTS idx_pdf_chunks_chapter_index 
  ON public.pdf_chunks(chapter_id, chunk_index);

-- =====================================================
-- QUERY PERFORMANCE FUNCTIONS
-- =====================================================

-- Function to get subject with chapter count (optimized)
CREATE OR REPLACE FUNCTION get_subject_stats(subject_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  created_at TIMESTAMPTZ,
  chapter_count BIGINT,
  file_count BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    s.id,
    s.title,
    s.created_at,
    COUNT(DISTINCT c.id) as chapter_count,
    COUNT(DISTINCT f.id) as file_count
  FROM public.subjects s
  LEFT JOIN public.chapters c ON c.subject_id = s.id
  LEFT JOIN public.files f ON f.chapter_id = c.id
  WHERE s.id = subject_uuid
  GROUP BY s.id, s.title, s.created_at;
$$;

-- Function to get chapter with file and chat count (optimized)
CREATE OR REPLACE FUNCTION get_chapter_stats(chapter_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  created_at TIMESTAMPTZ,
  file_count BIGINT,
  chat_count BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    c.id,
    c.title,
    c.created_at,
    COUNT(DISTINCT f.id) as file_count,
    COUNT(DISTINCT ch.id) as chat_count
  FROM public.chapters c
  LEFT JOIN public.files f ON f.chapter_id = c.id
  LEFT JOIN public.chats ch ON ch.chapter_id = c.id
  WHERE c.id = chapter_uuid
  GROUP BY c.id, c.title, c.created_at;
$$;

-- =====================================================
-- VACUUM AND ANALYZE FOR OPTIMIZATION
-- =====================================================

-- Analyze tables for query planner optimization
ANALYZE public.subjects;
ANALYZE public.chapters;
ANALYZE public.files;
ANALYZE public.chats;
ANALYZE public.pdf_chunks;
ANALYZE public.flashcards;

-- Add comments
COMMENT ON INDEX idx_subjects_user_created IS 'Composite index for user subject listings';
COMMENT ON INDEX idx_chapters_subject_created IS 'Composite index for subject chapter listings';
COMMENT ON INDEX idx_files_chapter_status IS 'Composite index for file listings with status';
COMMENT ON INDEX idx_chats_chapter_created IS 'Composite index for chat history retrieval';
COMMENT ON FUNCTION get_subject_stats IS 'Optimized function to get subject with statistics';
COMMENT ON FUNCTION get_chapter_stats IS 'Optimized function to get chapter with statistics';


