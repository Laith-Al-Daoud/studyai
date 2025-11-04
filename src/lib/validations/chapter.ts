/**
 * Chapter Validation Schemas
 * 
 * Zod schemas for validating chapter forms
 */

import { z } from 'zod'

export const createChapterSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  subjectId: z.string().uuid('Invalid subject ID'),
})

export const updateChapterSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
})

export type CreateChapterInput = z.infer<typeof createChapterSchema>
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>

