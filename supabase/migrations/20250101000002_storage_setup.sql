-- StudAI Storage Bucket Configuration
-- Creates private storage bucket for PDF files with RLS policies

-- =====================================================
-- CREATE STORAGE BUCKET
-- =====================================================

-- Create private bucket for PDF files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'pdfs',
    'pdfs',
    false,  -- private bucket
    52428800,  -- 50MB limit
    ARRAY['application/pdf']  -- only PDFs allowed
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE RLS POLICIES
-- =====================================================

-- Users can upload files to their own user folder
CREATE POLICY "users_upload_own_pdfs"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own files
CREATE POLICY "users_select_own_pdfs"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own files
CREATE POLICY "users_update_own_pdfs"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own files
CREATE POLICY "users_delete_own_pdfs"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- STORAGE HELPER FUNCTIONS
-- =====================================================

-- Function to generate signed URLs (called from application layer)
-- This is a placeholder - signed URLs are typically generated in the app layer
-- Note: Comments on storage schema require elevated permissions


