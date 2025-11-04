/**
 * Unit Tests for File Validation Schemas
 */

import {
  uploadFileSchema,
  deleteFileSchema,
  validateFileClient,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from '../file'

describe('File Validation Schemas', () => {
  describe('uploadFileSchema', () => {
    it('should validate correct file upload data', () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const validData = {
        chapterId: '123e4567-e89b-12d3-a456-426614174000',
        file: mockFile,
      }
      
      const result = uploadFileSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID for chapterId', () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const invalidData = {
        chapterId: 'not-a-uuid',
        file: mockFile,
      }
      
      const result = uploadFileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing file', () => {
      const invalidData = {
        chapterId: '123e4567-e89b-12d3-a456-426614174000',
      }
      
      const result = uploadFileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('deleteFileSchema', () => {
    it('should validate correct file deletion data', () => {
      const validData = {
        fileId: '123e4567-e89b-12d3-a456-426614174000',
        storagePath: 'files/test.pdf',
      }
      
      const result = deleteFileSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID for fileId', () => {
      const invalidData = {
        fileId: 'not-a-uuid',
        storagePath: 'files/test.pdf',
      }
      
      const result = deleteFileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty storagePath', () => {
      const invalidData = {
        fileId: '123e4567-e89b-12d3-a456-426614174000',
        storagePath: '',
      }
      
      const result = deleteFileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('validateFileClient', () => {
    it('should accept valid PDF file', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB
      
      const result = validateFileClient(file)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept valid PPTX file', () => {
      const file = new File(['content'], 'presentation.pptx', {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB
      
      const result = validateFileClient(file)
      expect(result.valid).toBe(true)
    })

    it('should accept valid PPT file', () => {
      const file = new File(['content'], 'presentation.ppt', {
        type: 'application/vnd.ms-powerpoint',
      })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB
      
      const result = validateFileClient(file)
      expect(result.valid).toBe(true)
    })

    it('should reject file exceeding max size', () => {
      const file = new File(['content'], 'large.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE + 1 })
      
      const result = validateFileClient(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('size')
    })

    it('should reject invalid MIME type', () => {
      const file = new File(['content'], 'document.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 })
      
      const result = validateFileClient(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('PDF and PPTX')
    })

    it('should reject invalid file extension', () => {
      const file = new File(['content'], 'document.txt', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 })
      
      const result = validateFileClient(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('extension')
    })

    it('should accept file at exact max size', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE })
      
      const result = validateFileClient(file)
      expect(result.valid).toBe(true)
    })
  })

  describe('File size and MIME type constants', () => {
    it('should have correct MAX_FILE_SIZE', () => {
      expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024) // 50MB
    })

    it('should have correct ALLOWED_MIME_TYPES', () => {
      expect(ALLOWED_MIME_TYPES).toContain('application/pdf')
      expect(ALLOWED_MIME_TYPES).toContain(
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      )
      expect(ALLOWED_MIME_TYPES).toContain('application/vnd.ms-powerpoint')
    })
  })
})


