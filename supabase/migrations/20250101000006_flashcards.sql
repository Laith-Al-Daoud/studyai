-- Create flashcards table
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  flashcard_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_flashcards_chapter_id ON public.flashcards(chapter_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_file_id ON public.flashcards(file_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_chapter_file ON public.flashcards(chapter_id, file_id);

-- Enable Row Level Security
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flashcards

-- Allow users to view their own flashcards
CREATE POLICY "Users can view their own flashcards"
  ON public.flashcards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters c
      JOIN public.subjects s ON c.subject_id = s.id
      WHERE c.id = flashcards.chapter_id
      AND s.user_id = auth.uid()
    )
  );

-- Allow users to insert flashcards for their chapters
CREATE POLICY "Users can insert flashcards for their chapters"
  ON public.flashcards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chapters c
      JOIN public.subjects s ON c.subject_id = s.id
      WHERE c.id = flashcards.chapter_id
      AND s.user_id = auth.uid()
    )
  );

-- Allow users to delete their own flashcards
CREATE POLICY "Users can delete their own flashcards"
  ON public.flashcards
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters c
      JOIN public.subjects s ON c.subject_id = s.id
      WHERE c.id = flashcards.chapter_id
      AND s.user_id = auth.uid()
    )
  );

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to update updated_at
CREATE TRIGGER update_flashcards_updated_at
  BEFORE UPDATE ON public.flashcards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for flashcards table
ALTER PUBLICATION supabase_realtime ADD TABLE public.flashcards;

