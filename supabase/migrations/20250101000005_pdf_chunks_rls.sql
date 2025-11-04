-- RLS Policies for pdf_chunks table

-- Enable RLS
ALTER TABLE pdf_chunks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view chunks for their own chapters
CREATE POLICY "Users can view their own pdf chunks"
ON pdf_chunks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chapters
    JOIN subjects ON chapters.subject_id = subjects.id
    WHERE chapters.id = pdf_chunks.chapter_id
    AND subjects.user_id = auth.uid()
  )
);

-- Policy: Service role can insert chunks (for n8n processing)
CREATE POLICY "Service role can insert pdf chunks"
ON pdf_chunks
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy: Service role can update chunks
CREATE POLICY "Service role can update pdf chunks"
ON pdf_chunks
FOR UPDATE
TO service_role
USING (true);

-- Policy: Users can delete chunks for their own chapters
CREATE POLICY "Users can delete their own pdf chunks"
ON pdf_chunks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chapters
    JOIN subjects ON chapters.subject_id = subjects.id
    WHERE chapters.id = pdf_chunks.chapter_id
    AND subjects.user_id = auth.uid()
  )
);

-- Enable Realtime for pdf_chunks (optional, for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE pdf_chunks;


