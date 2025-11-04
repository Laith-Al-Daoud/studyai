# Flashcards Feature Documentation

## Overview

The Flashcards feature automatically generates study flashcards from uploaded PDF files using an n8n workflow integration. Users can view and navigate through flashcards directly in the chat interface.

## Architecture

### Database Schema

**Table: `flashcards`**
- `id` (UUID, Primary Key)
- `chapter_id` (UUID, Foreign Key → chapters)
- `file_id` (UUID, Foreign Key → files)
- `flashcard_id` (TEXT) - ID from n8n response
- `question` (TEXT)
- `answer` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_flashcards_chapter_id` - For chapter lookups
- `idx_flashcards_file_id` - For file lookups
- `idx_flashcards_chapter_file` - Composite index for chapter+file queries

**RLS Policies:**
- Users can only view/insert/delete flashcards for their own chapters
- Flashcards cascade delete when associated files are deleted

### Workflow

1. **File Upload**
   - User uploads a PDF file
   - File-upload webhook generates a signed URL (7 days expiry)
   - Webhook calls n8n endpoint: `https://laithaldaoud.app.n8n.cloud/webhook/flashcards`
   - n8n processes PDF and returns flashcards

2. **n8n Response Format**
   ```json
   [
     {
       "output": {
         "flashcards": [
           {
             "id": "1",
             "question": "What is X?",
             "answer": "X is..."
           },
           ...
         ]
       }
     }
   ]
   ```

3. **Data Storage**
   - Edge function parses response
   - Inserts flashcards into database
   - Associates with chapter_id and file_id

4. **File Deletion**
   - User deletes file
   - Flashcards are automatically deleted (cascade or explicit)

### UI Components

#### 1. Flashcard Button
**Location:** Chat interface header  
**Behavior:**
- Disabled by default (when no flashcards exist)
- Shows count when flashcards available: "Flashcards (20)"
- Enabled when flashcards exist for the chapter
- Opens FlashcardModal on click

#### 2. FlashcardModal
**Features:**
- Modal dialog displaying flashcards
- Shows current position: "Flashcards (1 / 20)"
- Navigation arrows (left/right)
- Keyboard navigation (arrow keys, ESC to close)
- Progress indicator dots at bottom

#### 3. Flashcard Component
**Features:**
- Card displays question initially
- Click to toggle between question and answer
- Visual indicator showing current side (Question/Answer)
- Smooth animations for transitions
- Hover effects for better UX

### Server Actions

**`getChapterFlashcards(chapterId)`**
- Fetches all flashcards for a chapter
- Returns: `{ success, data: FlashcardRow[] }`

**`getFileFlashcards(fileId)`**
- Fetches flashcards for a specific file
- Returns: `{ success, data: FlashcardRow[] }`

**`createFlashcards(input)`**
- Creates multiple flashcards at once
- Validates user ownership
- Input: `{ chapter_id, file_id, flashcards: Array<{id, question, answer}> }`

**`deleteFileFlashcards(input)`**
- Deletes all flashcards for a file
- Input: `{ file_id }`

### Realtime Updates

The chat interface subscribes to flashcard changes:
- **INSERT events** - New flashcards added to UI
- **DELETE events** - Flashcards removed from UI

## Usage Flow

### For Users

1. **Upload a PDF file** to a chapter
2. Wait for processing (flashcards are generated in background)
3. **"Flashcards" button** becomes enabled automatically
4. Click the button to **view flashcards**
5. Use arrows or keyboard to **navigate**
6. Click card to **toggle** between question and answer
7. **Delete file** to remove associated flashcards

### For Developers

#### Adding Flashcards Support to New Areas

```typescript
import { getChapterFlashcards } from '@/lib/actions/flashcards';
import { FlashcardModal } from '@/components/flashcard/FlashcardModal';

// Fetch flashcards
const result = await getChapterFlashcards(chapterId);
if (result.success && result.data) {
  setFlashcards(result.data);
}

// Render modal
<FlashcardModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  flashcards={flashcards}
/>
```

#### Subscribing to Realtime Updates

```typescript
const channel = supabase
  .channel('flashcards-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'flashcards',
      filter: `chapter_id=eq.${chapterId}`,
    },
    (payload) => {
      // Handle INSERT, UPDATE, DELETE
    }
  )
  .subscribe();
```

## Error Handling

### Webhook Failures
- Non-blocking: File upload succeeds even if flashcard generation fails
- Errors logged to console
- User can still use files normally

### Database Errors
- Flashcard insertion errors are logged but don't affect file upload
- Deletion errors are handled gracefully (might already be deleted)

### UI States
- Button disabled when no flashcards available
- Modal shows nothing if flashcard list is empty
- Loading states for async operations

## Configuration

### Environment Variables
No new environment variables required. The n8n webhook URL is hardcoded in the edge function:
```typescript
const flashcardsWebhookUrl = 'https://laithaldaoud.app.n8n.cloud/webhook/flashcards';
```

To change the endpoint, modify:
- File: `studai/supabase/functions/file-upload-webhook/index.ts`
- Line: 92

## Future Enhancements

Potential improvements:
1. **Spaced Repetition** - Track user progress and schedule reviews
2. **Manual Creation** - Allow users to create custom flashcards
3. **Edit/Delete Individual Cards** - Modify generated flashcards
4. **Export/Import** - Share flashcard sets
5. **Study Mode** - Shuffle, mark as known, etc.
6. **Multiple Choice** - Generate multiple choice questions
7. **Progress Tracking** - Analytics on study sessions

## Testing

### Manual Testing Steps

1. **Create Test Data**
   ```bash
   # Apply migrations
   supabase db reset
   ```

2. **Upload PDF**
   - Navigate to a chapter
   - Upload a PDF file
   - Check console logs for webhook calls

3. **Verify Flashcards**
   - Check database: `SELECT * FROM flashcards;`
   - Verify flashcard button is enabled
   - Click button to open modal

4. **Test Navigation**
   - Click arrows to navigate
   - Use keyboard arrows
   - Click cards to toggle

5. **Test Deletion**
   - Delete the file
   - Verify flashcards are removed from UI
   - Check database: flashcards should be deleted

### Database Queries

```sql
-- Check flashcards for a chapter
SELECT * FROM flashcards WHERE chapter_id = 'chapter-uuid';

-- Check flashcards for a file
SELECT * FROM flashcards WHERE file_id = 'file-uuid';

-- Count flashcards
SELECT chapter_id, COUNT(*) 
FROM flashcards 
GROUP BY chapter_id;
```

## Troubleshooting

### Flashcards Not Appearing

1. **Check n8n webhook**
   - Verify endpoint is accessible
   - Check n8n logs for processing errors

2. **Check edge function logs**
   ```bash
   supabase functions logs file-upload-webhook
   ```

3. **Verify database**
   ```sql
   SELECT * FROM flashcards WHERE chapter_id = 'your-chapter-id';
   ```

4. **Check RLS policies**
   - Ensure user has access to the chapter
   - Verify policies are enabled

### Button Not Enabling

1. **Verify flashcards exist**
   - Check database
   - Ensure chapter_id matches

2. **Check realtime subscription**
   - Open browser console
   - Look for subscription errors

3. **Refresh the page**
   - Force reload to fetch latest data

### Navigation Issues

1. **Keyboard not working**
   - Ensure modal is focused
   - Check for JS errors in console

2. **Cards not toggling**
   - Check onClick handler
   - Verify card component renders properly

## Migration

The flashcards migration file:
- `studai/supabase/migrations/20250101000006_flashcards.sql`

Apply with:
```bash
supabase db reset
# or
supabase migration up
```

## Files Modified/Created

### Created
- `studai/supabase/migrations/20250101000006_flashcards.sql`
- `studai/src/lib/validations/flashcard.ts`
- `studai/src/lib/actions/flashcards.ts`
- `studai/src/components/flashcard/Flashcard.tsx`
- `studai/src/components/flashcard/FlashcardModal.tsx`
- `studai/Docs/FLASHCARDS_FEATURE.md`

### Modified
- `studai/supabase/functions/file-upload-webhook/index.ts`
- `studai/src/lib/actions/files.ts`
- `studai/src/lib/validations/index.ts`
- `studai/src/lib/actions/index.ts`
- `studai/src/components/chat/ChatInterface.tsx`
- `studai/src/types/database.ts` (auto-generated)

## Conclusion

The flashcards feature seamlessly integrates with the existing file upload workflow, automatically generating study materials from PDFs. The implementation includes proper error handling, realtime updates, and a clean UI for studying.

