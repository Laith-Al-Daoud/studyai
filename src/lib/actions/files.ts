/**
 * File Server Actions
 * 
 * Server-side operations for file upload, deletion, and management
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { deleteFileSchema, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '@/lib/validations/file';
import type { Database } from '@/types/database';
import { 
  convertPptxToPdf, 
  isPowerPointFile, 
  fileToBuffer 
} from '@/lib/utils/pptx-to-pdf';

export type FileRow = Database['public']['Tables']['files']['Row'];

/**
 * Get all files for a chapter
 */
export async function getChapterFiles(chapterId: string) {
  try {
    const supabase = await createClient();

    const { data: files, error } = await supabase
      .from('files')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching files:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: files };
  } catch (error) {
    console.error('Error in getChapterFiles:', error);
    return { success: false, error: 'Failed to fetch files' };
  }
}

/**
 * Upload a file to Supabase Storage and save metadata
 */
export async function uploadFile(formData: FormData) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Extract form data
    const chapterId = formData.get('chapterId') as string;
    const file = formData.get('file') as File;

    if (!chapterId || !file) {
      return { success: false, error: 'Chapter ID and file are required' };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { 
        success: false, 
        error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      };
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return { success: false, error: 'Only PDF and PPTX files are allowed' };
    }

    // Verify user owns this chapter
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id, subject_id, subjects!inner(user_id)')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) {
      return { success: false, error: 'Chapter not found' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((chapter.subjects as any).user_id !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if file is PowerPoint and needs conversion
    const isPptx = isPowerPointFile(file.type);
    let fileToUpload: File | Buffer = file;
    let finalFileName = file.name;
    
    if (isPptx) {
      try {
        console.log(`Converting PowerPoint file: ${file.name}`);
        
        // Convert File to Buffer
        const fileBuffer = await fileToBuffer(file);
        
        // Convert PPTX to PDF
        const pdfBuffer = await convertPptxToPdf(fileBuffer, file.name);
        
        // Update the file to upload to the PDF buffer
        fileToUpload = pdfBuffer;
        
        // Change extension to .pdf
        finalFileName = file.name.replace(/\.(pptx|ppt)$/i, '.pdf');
        
        console.log(`Successfully converted ${file.name} to ${finalFileName}`);
      } catch (conversionError) {
        console.error('Conversion error:', conversionError);
        return { 
          success: false, 
          error: conversionError instanceof Error 
            ? conversionError.message 
            : 'Failed to convert PowerPoint file to PDF. Please ensure LibreOffice is installed on the server.'
        };
      }
    }

    // Generate unique file name
    const timestamp = Date.now();
    const sanitizedFileName = finalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    
    // Storage path: user_id/subject_id/chapter_id/filename
    const storagePath = `${user.id}/${chapter.subject_id}/${chapterId}/${fileName}`;

    // Upload to Supabase Storage (always as PDF)
    const { error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(storagePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf', // Always store as PDF
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { success: false, error: 'Failed to upload file' };
    }

    // Save file metadata to database (store original name for reference)
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        chapter_id: chapterId,
        file_name: isPptx ? `${file.name} (converted to PDF)` : file.name,
        file_url: storagePath, // Store the storage path, not the public URL
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: delete uploaded file
      await supabase.storage.from('pdfs').remove([storagePath]);
      console.error('Database insert error:', dbError);
      return { success: false, error: 'Failed to save file metadata' };
    }

    // Trigger Edge Function webhook to n8n (if configured)
    // This will be implemented when we create the Edge Function
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/file-upload-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          subject_id: chapter.subject_id,
          chapter_id: chapterId,
          file_id: fileRecord.id,
          file_url: storagePath,
          file_name: file.name,
        }),
      });
    } catch (webhookError) {
      // Don't fail the upload if webhook fails
      console.error('Webhook error (non-critical):', webhookError);
    }

    // Revalidate the chapter page
    revalidatePath(`/chapter/${chapterId}`);

    return { 
      success: true, 
      data: fileRecord,
      message: 'File uploaded successfully' 
    };
  } catch (error) {
    console.error('Error in uploadFile:', error);
    return { success: false, error: 'Failed to upload file' };
  }
}

/**
 * Delete a file from storage and database
 */
export async function deleteFile(input: { fileId: string; storagePath: string }) {
  try {
    // Validate input
    const validated = deleteFileSchema.parse(input);

    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify user owns this file
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id, chapter_id, file_url, chapters!inner(subject_id, subjects!inner(user_id))')
      .eq('id', validated.fileId)
      .single();

    if (fileError || !file) {
      return { success: false, error: 'File not found' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((file.chapters as any).subjects.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Delete associated flashcards first
    const { error: flashcardsError } = await supabase
      .from('flashcards')
      .delete()
      .eq('file_id', validated.fileId);

    if (flashcardsError) {
      console.error('Flashcards deletion error:', flashcardsError);
      // Continue anyway - flashcards might not exist
    }

    // Delete all chat messages for this chapter when a file is deleted
    const { error: chatsError } = await supabase
      .from('chats')
      .delete()
      .eq('chapter_id', file.chapter_id);

    if (chatsError) {
      console.error('Chats deletion error:', chatsError);
      // Continue anyway - chats might not exist
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('pdfs')
      .remove([validated.storagePath]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue anyway - file might already be deleted
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', validated.fileId);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      return { success: false, error: 'Failed to delete file' };
    }

    // Revalidate the chapter page
    revalidatePath(`/chapter/${file.chapter_id}`);

    return { success: true, message: 'File deleted successfully' };
  } catch (error) {
    console.error('Error in deleteFile:', error);
    return { success: false, error: 'Failed to delete file' };
  }
}

/**
 * Get a signed URL for secure file download
 */
export async function getSignedFileUrl(storagePath: string, expiresIn: number = 3600) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify the path starts with user's ID
    if (!storagePath.startsWith(user.id)) {
      return { success: false, error: 'Unauthorized' };
    }

    // Generate signed URL
    const { data, error } = await supabase.storage
      .from('pdfs')
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return { success: false, error: 'Failed to generate download URL' };
    }

    return { success: true, data: data.signedUrl };
  } catch (error) {
    console.error('Error in getSignedFileUrl:', error);
    return { success: false, error: 'Failed to generate download URL' };
  }
}

