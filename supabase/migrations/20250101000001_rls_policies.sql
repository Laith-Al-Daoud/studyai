-- StudAI Row-Level Security Policies
-- Implements security policies to ensure users can only access their own data

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUBJECTS RLS POLICIES
-- =====================================================

-- Users can view their own subjects
CREATE POLICY "subjects_select_own" 
ON public.subjects
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own subjects
CREATE POLICY "subjects_insert_own" 
ON public.subjects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own subjects
CREATE POLICY "subjects_update_own" 
ON public.subjects
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own subjects
CREATE POLICY "subjects_delete_own" 
ON public.subjects
FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- CHAPTERS RLS POLICIES
-- =====================================================

-- Users can view chapters in their own subjects
CREATE POLICY "chapters_select_own" 
ON public.chapters
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.subjects
        WHERE subjects.id = chapters.subject_id
        AND subjects.user_id = auth.uid()
    )
);

-- Users can insert chapters in their own subjects
CREATE POLICY "chapters_insert_own" 
ON public.chapters
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.subjects
        WHERE subjects.id = chapters.subject_id
        AND subjects.user_id = auth.uid()
    )
);

-- Users can update chapters in their own subjects
CREATE POLICY "chapters_update_own" 
ON public.chapters
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.subjects
        WHERE subjects.id = chapters.subject_id
        AND subjects.user_id = auth.uid()
    )
);

-- Users can delete chapters in their own subjects
CREATE POLICY "chapters_delete_own" 
ON public.chapters
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.subjects
        WHERE subjects.id = chapters.subject_id
        AND subjects.user_id = auth.uid()
    )
);

-- =====================================================
-- FILES RLS POLICIES
-- =====================================================

-- Users can view files in their own chapters
CREATE POLICY "files_select_own" 
ON public.files
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.chapters
        JOIN public.subjects ON subjects.id = chapters.subject_id
        WHERE chapters.id = files.chapter_id
        AND subjects.user_id = auth.uid()
    )
);

-- Users can insert files in their own chapters
CREATE POLICY "files_insert_own" 
ON public.files
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chapters
        JOIN public.subjects ON subjects.id = chapters.subject_id
        WHERE chapters.id = files.chapter_id
        AND subjects.user_id = auth.uid()
    )
);

-- Users can update files in their own chapters
CREATE POLICY "files_update_own" 
ON public.files
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.chapters
        JOIN public.subjects ON subjects.id = chapters.subject_id
        WHERE chapters.id = files.chapter_id
        AND subjects.user_id = auth.uid()
    )
);

-- Users can delete files in their own chapters
CREATE POLICY "files_delete_own" 
ON public.files
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.chapters
        JOIN public.subjects ON subjects.id = chapters.subject_id
        WHERE chapters.id = files.chapter_id
        AND subjects.user_id = auth.uid()
    )
);

-- =====================================================
-- CHATS RLS POLICIES
-- =====================================================

-- Users can view their own chat messages
CREATE POLICY "chats_select_own" 
ON public.chats
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own chat messages
CREATE POLICY "chats_insert_own" 
ON public.chats
FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.chapters
        JOIN public.subjects ON subjects.id = chapters.subject_id
        WHERE chapters.id = chats.chapter_id
        AND subjects.user_id = auth.uid()
    )
);

-- Users can update their own chat messages
-- Note: typically only service role updates responses
CREATE POLICY "chats_update_own" 
ON public.chats
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own chat messages
CREATE POLICY "chats_delete_own" 
ON public.chats
FOR DELETE
USING (auth.uid() = user_id);


