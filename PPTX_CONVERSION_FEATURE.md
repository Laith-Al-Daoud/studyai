# PPTX to PDF Conversion Feature

## Overview
Added support for uploading PowerPoint files (.pptx and .ppt) which are automatically converted to PDF before storage. This ensures all documents in the system are stored in a standardized PDF format while providing users the convenience of uploading their PowerPoint presentations.

## Changes Made

### 1. File Validation (`src/lib/validations/file.ts`)
- **Updated ALLOWED_MIME_TYPES** to include:
  - `application/vnd.openxmlformats-officedocument.presentationml.presentation` (.pptx)
  - `application/vnd.ms-powerpoint` (.ppt legacy)
- **Updated validateFileClient()** to accept PDF, PPTX, and PPT file extensions
- Updated error messages to reflect support for multiple file types

### 2. PPTX to PDF Utility (`src/lib/utils/pptx-to-pdf.ts`) - NEW FILE
Created a new utility module with the following functions:

- **convertPptxToPdf()**: Converts PowerPoint file buffers to PDF using LibreOffice
- **isPowerPointFile()**: Checks if a file is PowerPoint based on MIME type
- **isPowerPointFileByName()**: Checks if a file is PowerPoint based on extension
- **fileToBuffer()**: Converts File objects to Buffer for processing

**Dependencies**: Uses `libreoffice-convert` package which requires LibreOffice to be installed on the server.

### 3. File Upload Server Action (`src/lib/actions/files.ts`)
- Added import for PPTX conversion utilities
- **Modified uploadFile()** to:
  1. Detect if uploaded file is PowerPoint
  2. Convert PPTX/PPT to PDF buffer before storage
  3. Update filename to .pdf extension
  4. Store converted PDF with indication in filename "(converted to PDF)"
  5. Always set contentType to 'application/pdf' when uploading
- Added comprehensive error handling for conversion failures

### 4. Client Upload Component (`src/components/file/FileUpload.tsx`)
- **Updated file input accept attribute** to include:
  - `.pdf, .pptx, .ppt`
  - PowerPoint MIME types
- **Updated UI text**:
  - Changed "Upload PDF File" to "Upload PDF or PPTX File"
  - Added format information: "Accepted: PDF, PPTX, PPT"
  - Added note: "PowerPoint files will be converted to PDF"

### 5. Database Types (`src/types/database.ts`)
- Regenerated TypeScript types from Supabase database schema
- Fixed type definitions to resolve linting errors

### 6. Package Dependencies (`package.json`)
- Added `libreoffice-convert` package for document conversion

### 7. TypeScript Configuration (`tsconfig.json`)
- Excluded `supabase/functions` from TypeScript compilation
- Edge functions use Deno and should not be checked by Node.js TypeScript compiler

### 8. Bug Fixes (Pre-existing Issues)
Fixed several TypeScript errors found during build:
- **PomodoroTimer.tsx**: Fixed state comparison type error
- **chat.ts**: Replaced unused `@ts-expect-error` directives with proper type casting
- **chat.ts**: Fixed Json type casting for meta field

## Storage Architecture

### Important: No Storage Bucket Changes Needed
The storage bucket (`pdfs`) continues to only accept PDF files. PPTX files are:
1. ✅ Accepted by client-side validation
2. ✅ Validated on server-side
3. ✅ Converted to PDF in-memory
4. ✅ Stored as PDF in Supabase Storage
5. ❌ NEVER stored as PPTX

This maintains data consistency while providing user convenience.

## System Requirements

### Server Requirements
**LibreOffice must be installed** on the server for PPTX conversion to work.

#### Installation:

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y libreoffice
```

**macOS:**
```bash
brew install libreoffice
```

**Docker (for deployment):**
Add to Dockerfile:
```dockerfile
RUN apt-get update && \
    apt-get install -y libreoffice && \
    apt-get clean
```

### Error Handling
If LibreOffice is not installed, the system will:
1. Show a clear error message to the user
2. Log the error for debugging
3. Not upload the file
4. Provide instructions about LibreOffice requirement

## User Experience

### Upload Flow
1. User drags/selects a PPTX file
2. Client validates file (size, type, extension)
3. File is uploaded to server
4. Server detects PowerPoint format
5. Server converts PPTX → PDF (using LibreOffice)
6. Converted PDF is stored in Supabase Storage
7. Database record shows: "filename.pptx (converted to PDF)"
8. User sees success message

### Supported Formats
- ✅ PDF (direct upload, no conversion)
- ✅ PPTX (converted to PDF)
- ✅ PPT (converted to PDF)
- ❌ Other formats (rejected)

## Testing Checklist

- [ ] Upload PDF file (should work as before)
- [ ] Upload PPTX file (should convert and store as PDF)
- [ ] Upload PPT file (should convert and store as PDF)
- [ ] Try to upload unsupported format (should reject)
- [ ] Verify converted files open correctly
- [ ] Check file metadata shows conversion note
- [ ] Test with large PPTX files (near 50MB limit)
- [ ] Verify error handling when LibreOffice not installed
- [ ] Test drag-and-drop for PPTX files
- [ ] Verify file list shows converted files correctly

## Future Improvements

### Potential Enhancements
1. **Progress Indicator**: Show conversion progress for large files
2. **Preview**: Generate thumbnail preview of first slide
3. **Cloud Conversion**: Use cloud service instead of LibreOffice for serverless deployments
4. **Additional Formats**: Support DOCX, ODT, etc.
5. **Batch Upload**: Allow multiple file uploads at once
6. **Conversion Queue**: For heavy load, queue conversions

### Cloud Alternatives
For serverless environments (like Vercel) where installing LibreOffice is not feasible:
- CloudConvert API
- Zamzar API
- Convertio API
- Adobe PDF Services API
- Microsoft Graph API (for Office files)

## Notes

### Performance Considerations
- Conversion happens synchronously during upload
- Large PPTX files may take several seconds to convert
- Consider implementing a queue system for production with high traffic

### Security Considerations
- File validation happens both client and server-side
- Original PPTX is never stored (only converted PDF)
- LibreOffice runs in isolated process
- File size limits (50MB) help prevent abuse

### Deployment Considerations
- Ensure LibreOffice is installed in production environment
- Test conversion with various PowerPoint file versions
- Monitor conversion times and errors
- Consider conversion timeout limits
- Plan for scaling if conversion becomes a bottleneck

## Author
AI Assistant
Date: November 4, 2025


