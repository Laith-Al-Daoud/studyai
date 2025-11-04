/**
 * Flashcard Validation Schemas
 */

import { z } from 'zod';

export const flashcardSchema = z.object({
  chapter_id: z.string().uuid(),
  file_id: z.string().uuid(),
  flashcard_id: z.string(),
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
});

export const createFlashcardsSchema = z.object({
  chapter_id: z.string().uuid(),
  file_id: z.string().uuid(),
  flashcards: z.array(
    z.object({
      id: z.string(),
      question: z.string().min(1),
      answer: z.string().min(1),
    })
  ),
});

export const deleteFlashcardsSchema = z.object({
  file_id: z.string().uuid(),
});

export type FlashcardInput = z.infer<typeof flashcardSchema>;
export type CreateFlashcardsInput = z.infer<typeof createFlashcardsSchema>;
export type DeleteFlashcardsInput = z.infer<typeof deleteFlashcardsSchema>;

