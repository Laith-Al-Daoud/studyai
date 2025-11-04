/**
 * Unit Tests for Chapter Validation Schemas
 */

import { createChapterSchema, updateChapterSchema } from '../chapter'

describe('Chapter Validation Schemas', () => {
  describe('createChapterSchema', () => {
    it('should validate correct chapter data', () => {
      const validData = {
        title: 'Introduction to Algebra',
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
      }
      
      const result = createChapterSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
      }
      
      const result = createChapterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject title longer than 100 characters', () => {
      const invalidData = {
        title: 'a'.repeat(101),
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
      }
      
      const result = createChapterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid UUID for subjectId', () => {
      const invalidData = {
        title: 'Chapter 1',
        subjectId: 'not-a-uuid',
      }
      
      const result = createChapterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing subjectId', () => {
      const invalidData = {
        title: 'Chapter 1',
      }
      
      const result = createChapterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept title at maximum length', () => {
      const validData = {
        title: 'a'.repeat(100),
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
      }
      
      const result = createChapterSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateChapterSchema', () => {
    it('should validate correct update data', () => {
      const validData = {
        title: 'Updated Chapter Title',
      }
      
      const result = updateChapterSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
      }
      
      const result = updateChapterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject overly long title', () => {
      const invalidData = {
        title: 'x'.repeat(101),
      }
      
      const result = updateChapterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept valid single character title', () => {
      const validData = {
        title: 'A',
      }
      
      const result = updateChapterSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})


