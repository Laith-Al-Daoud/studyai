/**
 * Unit Tests for PPTX to PDF conversion utilities
 */

import { isPowerPointFile, isPowerPointFileByName } from '../pptx-to-pdf'

describe('PowerPoint file detection utilities', () => {
  describe('isPowerPointFile', () => {
    it('should recognize .pptx MIME type', () => {
      const mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      expect(isPowerPointFile(mimeType)).toBe(true)
    })

    it('should recognize .ppt MIME type', () => {
      const mimeType = 'application/vnd.ms-powerpoint'
      expect(isPowerPointFile(mimeType)).toBe(true)
    })

    it('should reject PDF MIME type', () => {
      const mimeType = 'application/pdf'
      expect(isPowerPointFile(mimeType)).toBe(false)
    })

    it('should reject other document MIME types', () => {
      const mimeTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/png',
      ]
      
      mimeTypes.forEach(mimeType => {
        expect(isPowerPointFile(mimeType)).toBe(false)
      })
    })
  })

  describe('isPowerPointFileByName', () => {
    it('should recognize .pptx extension', () => {
      expect(isPowerPointFileByName('presentation.pptx')).toBe(true)
      expect(isPowerPointFileByName('my-slides.pptx')).toBe(true)
      expect(isPowerPointFileByName('LECTURE.PPTX')).toBe(true)
    })

    it('should recognize .ppt extension', () => {
      expect(isPowerPointFileByName('presentation.ppt')).toBe(true)
      expect(isPowerPointFileByName('old-format.ppt')).toBe(true)
      expect(isPowerPointFileByName('SLIDES.PPT')).toBe(true)
    })

    it('should reject PDF files', () => {
      expect(isPowerPointFileByName('document.pdf')).toBe(false)
    })

    it('should reject other file extensions', () => {
      const fileNames = [
        'document.doc',
        'document.docx',
        'image.png',
        'data.xlsx',
        'readme.txt',
      ]
      
      fileNames.forEach(fileName => {
        expect(isPowerPointFileByName(fileName)).toBe(false)
      })
    })

    it('should handle files with multiple dots', () => {
      expect(isPowerPointFileByName('my.presentation.pptx')).toBe(true)
      expect(isPowerPointFileByName('slides.v2.ppt')).toBe(true)
      expect(isPowerPointFileByName('file.backup.pdf')).toBe(false)
    })

    it('should be case-insensitive', () => {
      expect(isPowerPointFileByName('FILE.PPTX')).toBe(true)
      expect(isPowerPointFileByName('File.Ppt')).toBe(true)
      expect(isPowerPointFileByName('MiXeD.PpTx')).toBe(true)
    })
  })
})


