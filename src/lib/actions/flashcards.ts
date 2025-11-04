/**
 * Flashcard Server Actions
 * 
 * Server-side operations for flashcard management
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createFlashcardsSchema, deleteFlashcardsSchema } from '@/lib/validations/flashcard';
import type { Database } from '@/types/database';

export type FlashcardRow = Database['public']['Tables']['flashcards']['Row'];

/**
 * Get all flashcards for a chapter
 */
export async function getChapterFlashcards(chapterId: string) {
  try {
    const supabase = await createClient();

    const { data: flashcards, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching flashcards:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: flashcards };
  } catch (error) {
    console.error('Error in getChapterFlashcards:', error);
    return { success: false, error: 'Failed to fetch flashcards' };
  }
}

/**
 * Get all flashcards for a specific file
 */
export async function getFileFlashcards(fileId: string) {
  try {
    const supabase = await createClient();

    const { data: flashcards, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('file_id', fileId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching flashcards:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: flashcards };
  } catch (error) {
    console.error('Error in getFileFlashcards:', error);
    return { success: false, error: 'Failed to fetch flashcards' };
  }
}

/**
 * Create multiple flashcards at once
 */
export async function createFlashcards(input: {
  chapter_id: string;
  file_id: string;
  flashcards: Array<{ id: string; question: string; answer: string }>;
}) {
  try {
    // Validate input
    const validated = createFlashcardsSchema.parse(input);

    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify user owns this chapter
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id, subjects!inner(user_id)')
      .eq('id', validated.chapter_id)
      .single();

    if (chapterError || !chapter) {
      return { success: false, error: 'Chapter not found' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((chapter.subjects as any).user_id !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify file belongs to this chapter
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id, chapter_id')
      .eq('id', validated.file_id)
      .eq('chapter_id', validated.chapter_id)
      .single();

    if (fileError || !file) {
      return { success: false, error: 'File not found or does not belong to this chapter' };
    }

    // Transform flashcards for insertion
    const flashcardsToInsert = validated.flashcards.map((fc) => ({
      chapter_id: validated.chapter_id,
      file_id: validated.file_id,
      flashcard_id: fc.id,
      question: fc.question,
      answer: fc.answer,
    }));

    // Insert flashcards
    const { data, error } = await supabase
      .from('flashcards')
      .insert(flashcardsToInsert)
      .select();

    if (error) {
      console.error('Error creating flashcards:', error);
      return { success: false, error: 'Failed to create flashcards' };
    }

    // Revalidate the chapter page
    revalidatePath(`/chapter/${validated.chapter_id}`);

    return { 
      success: true, 
      data,
      message: `Successfully created ${data.length} flashcards` 
    };
  } catch (error) {
    console.error('Error in createFlashcards:', error);
    return { success: false, error: 'Failed to create flashcards' };
  }
}

/**
 * Delete all flashcards for a specific file
 */
export async function deleteFileFlashcards(input: { file_id: string }) {
  try {
    // Validate input
    const validated = deleteFlashcardsSchema.parse(input);

    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify user owns the flashcards through the file
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id, chapter_id, chapters!inner(subject_id, subjects!inner(user_id))')
      .eq('id', validated.file_id)
      .single();

    if (fileError || !file) {
      return { success: false, error: 'File not found' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((file.chapters as any).subjects.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Delete flashcards
    const { error: deleteError } = await supabase
      .from('flashcards')
      .delete()
      .eq('file_id', validated.file_id);

    if (deleteError) {
      console.error('Error deleting flashcards:', deleteError);
      return { success: false, error: 'Failed to delete flashcards' };
    }

    // Revalidate the chapter page
    revalidatePath(`/chapter/${file.chapter_id}`);

    return { 
      success: true, 
      message: 'Flashcards deleted successfully' 
    };
  } catch (error) {
    console.error('Error in deleteFileFlashcards:', error);
    return { success: false, error: 'Failed to delete flashcards' };
  }
}

