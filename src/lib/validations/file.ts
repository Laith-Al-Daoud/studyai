/**
 * File Upload Validation Schemas
 * 
 * Zod schemas for validating file upload operations
 */

import { z } from 'zod';

/**
 * Maximum file size: 50MB
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

/**
 * Allowed MIME types for upload
 * PPTX files will be converted to PDF before storage
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-powerpoint' // .ppt (legacy)
] as const;

/**
 * File upload validation schema
 */
export const uploadFileSchema = z.object({
  chapterId: z.string().uuid('Invalid chapter ID'),
  file: z.custom<File>(
    (file) => file instanceof File,
    'File is required'
  ),
});

/**
 * File deletion validation schema
 */
export const deleteFileSchema = z.object({
  fileId: z.string().uuid('Invalid file ID'),
  storagePath: z.string().min(1, 'Storage path is required'),
});

/**
 * File metadata schema
 */
export const fileMetadataSchema = z.object({
  id: z.string().uuid(),
  chapter_id: z.string().uuid(),
  file_name: z.string(),
  file_url: z.string(),
  created_at: z.string(),
});

/**
 * Client-side file validation
 */
export function validateFileClient(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return {
      valid: false,
      error: 'Only PDF and PPTX files are allowed'
    };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const validExtensions = ['.pdf', '.pptx', '.ppt'];
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'File must have .pdf, .pptx, or .ppt extension'
    };
  }

  return { valid: true };
}

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type DeleteFileInput = z.infer<typeof deleteFileSchema>;
export type FileMetadata = z.infer<typeof fileMetadataSchema>;

