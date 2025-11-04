/**
 * Unit Tests for Subject Validation Schemas
 */

import { createSubjectSchema, updateSubjectSchema } from '../subject'

describe('Subject Validation Schemas', () => {
  describe('createSubjectSchema', () => {
    it('should validate correct subject data', () => {
      const validData = {
        title: 'Mathematics',
      }
      
      const result = createSubjectSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
      }
      
      const result = createSubjectSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject title longer than 100 characters', () => {
      const invalidData = {
        title: 'a'.repeat(101),
      }
      
      const result = createSubjectSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept title at maximum length', () => {
      const validData = {
        title: 'a'.repeat(100),
      }
      
      const result = createSubjectSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject missing title', () => {
      const result = createSubjectSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('should trim whitespace from title', () => {
      const data = {
        title: '  Physics  ',
      }
      
      const result = createSubjectSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('updateSubjectSchema', () => {
    it('should validate correct update data', () => {
      const validData = {
        title: 'Updated Subject Name',
      }
      
      const result = updateSubjectSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
      }
      
      const result = updateSubjectSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject overly long title', () => {
      const invalidData = {
        title: 'x'.repeat(101),
      }
      
      const result = updateSubjectSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})


