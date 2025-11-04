-- StudAI Initial Database Schema
-- Creates all core tables: subjects, chapters, files, chats

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SUBJECTS TABLE
-- =====================================================
-- Stores subjects created by users
-- Each subject belongs to a specific user

CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX idx_subjects_created_at ON public.subjects(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.subjects IS 'User-created subjects for organizing study materials';
COMMENT ON COLUMN public.subjects.user_id IS 'FK to auth.users - owner of the subject';

-- =====================================================
-- CHAPTERS TABLE
-- =====================================================
-- Stores chapters within subjects
-- Each chapter belongs to a subject

CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chapters_subject_id ON public.chapters(subject_id);
CREATE INDEX idx_chapters_created_at ON public.chapters(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.chapters IS 'Chapters within subjects containing lecture materials';
COMMENT ON COLUMN public.chapters.subject_id IS 'FK to subjects - parent subject';

-- =====================================================
-- FILES TABLE
-- =====================================================
-- Stores PDF file metadata
-- Each file belongs to a chapter

CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_files_chapter_id ON public.files(chapter_id);
CREATE INDEX idx_files_created_at ON public.files(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.files IS 'PDF file metadata for chapter materials';
COMMENT ON COLUMN public.files.chapter_id IS 'FK to chapters - parent chapter';
COMMENT ON COLUMN public.files.file_url IS 'Supabase Storage URL for the PDF file';

-- =====================================================
-- CHATS TABLE
-- =====================================================
-- Stores chat messages and AI responses
-- Each chat message belongs to a chapter and user

CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chats_chapter_id ON public.chats(chapter_id);
CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_chats_created_at ON public.chats(created_at DESC);
CREATE INDEX idx_chats_chapter_user ON public.chats(chapter_id, user_id);

-- Add comments for documentation
COMMENT ON TABLE public.chats IS 'Chat history with AI responses for each chapter';
COMMENT ON COLUMN public.chats.chapter_id IS 'FK to chapters - associated chapter';
COMMENT ON COLUMN public.chats.user_id IS 'FK to auth.users - user who sent the message';
COMMENT ON COLUMN public.chats.message IS 'User message/question';
COMMENT ON COLUMN public.chats.response IS 'AI-generated response (NULL until processed)';
COMMENT ON COLUMN public.chats.meta IS 'Additional metadata (tokens, timestamps, etc.)';


