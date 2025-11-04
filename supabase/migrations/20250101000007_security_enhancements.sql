-- Stage 5: Security Enhancements and Hardening
-- Adds additional RLS policies for service role access and security improvements

-- =====================================================
-- CHATS TABLE - SERVICE ROLE POLICIES
-- =====================================================
-- Allow Edge Functions (service role) to update chat responses
-- This is critical for the chat webhook to function properly

CREATE POLICY "service_role_can_update_chat_responses"
ON public.chats
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- ADDITIONAL SECURITY CONSTRAINTS
-- =====================================================

-- Add check constraint to ensure subjects have non-empty titles
ALTER TABLE public.subjects 
ADD CONSTRAINT subjects_title_not_empty 
CHECK (length(trim(title)) > 0);

-- Add check constraint to ensure chapters have non-empty titles
ALTER TABLE public.chapters 
ADD CONSTRAINT chapters_title_not_empty 
CHECK (length(trim(title)) > 0);

-- Add check constraint to ensure files have valid names
ALTER TABLE public.files 
ADD CONSTRAINT files_filename_not_empty 
CHECK (length(trim(file_name)) > 0);

-- Add check constraint to ensure chat messages are not empty
ALTER TABLE public.chats 
ADD CONSTRAINT chats_message_not_empty 
CHECK (length(trim(message)) > 0);

-- Add check constraint for flashcard questions and answers
ALTER TABLE public.flashcards 
ADD CONSTRAINT flashcards_question_not_empty 
CHECK (length(trim(question)) > 0);

ALTER TABLE public.flashcards 
ADD CONSTRAINT flashcards_answer_not_empty 
CHECK (length(trim(answer)) > 0);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Add composite index for flashcards lookup by chapter
CREATE INDEX IF NOT EXISTS idx_flashcards_chapter_created 
ON public.flashcards(chapter_id, created_at DESC);

-- Add index for chat history ordering
CREATE INDEX IF NOT EXISTS idx_chats_chapter_created 
ON public.chats(chapter_id, created_at ASC);

-- =====================================================
-- STORAGE BUCKET ADDITIONAL POLICIES
-- =====================================================

-- Ensure service role can access files for processing
-- This allows Edge Functions to read files for n8n processing
CREATE POLICY "service_role_can_read_pdfs"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'pdfs');

-- =====================================================
-- SECURITY FUNCTIONS
-- =====================================================

-- Function to verify user owns a chapter (for validation)
CREATE OR REPLACE FUNCTION public.user_owns_chapter(chapter_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chapters
    JOIN public.subjects ON subjects.id = chapters.subject_id
    WHERE chapters.id = chapter_uuid
    AND subjects.user_id = user_uuid
  );
$$;

-- Function to verify user owns a subject (for validation)
CREATE OR REPLACE FUNCTION public.user_owns_subject(subject_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subjects
    WHERE subjects.id = subject_uuid
    AND subjects.user_id = user_uuid
  );
$$;

-- Add comments for security functions
COMMENT ON FUNCTION public.user_owns_chapter IS 'Verifies if a user owns a specific chapter (via subject ownership)';
COMMENT ON FUNCTION public.user_owns_subject IS 'Verifies if a user owns a specific subject';

-- =====================================================
-- AUDIT LOG TABLE (Optional - for security monitoring)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for audit log queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);

-- Enable RLS for audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow service role to write audit logs
CREATE POLICY "service_role_can_insert_audit_logs"
ON public.audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Users can view their own audit logs
CREATE POLICY "users_can_view_own_audit_logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE public.audit_logs IS 'Security audit trail for sensitive operations';

-- =====================================================
-- RATE LIMITING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, endpoint, window_start)
);

-- Index for rate limit lookups
CREATE INDEX idx_rate_limit_user_endpoint ON public.rate_limit_tracking(user_id, endpoint, window_start);

-- Enable RLS
ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "service_role_manages_rate_limits"
ON public.rate_limit_tracking
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.rate_limit_tracking IS 'Tracks API request rates for rate limiting';

-- =====================================================
-- CLEANUP FUNCTION FOR OLD DATA
-- =====================================================

-- Function to clean up old audit logs (keep last 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Function to clean up old rate limit data (keep last 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.rate_limit_tracking
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$;

-- Add comments
COMMENT ON FUNCTION public.cleanup_old_audit_logs IS 'Removes audit logs older than 90 days';
COMMENT ON FUNCTION public.cleanup_old_rate_limits IS 'Removes rate limit tracking data older than 24 hours';

