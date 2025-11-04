# Flashcards Feature - Quick Start Guide

## 🚀 Quick Setup

### 1. Apply Database Migration
```bash
cd studai
supabase db reset
```

### 2. Deploy Edge Function (if needed)
```bash
supabase functions deploy file-upload-webhook
```

### 3. Build Frontend
```bash
npm run build
```

That's it! The feature is ready to use.

## 📚 How to Use

### For End Users

1. **Navigate to a Chapter**
   - Go to a subject and select a chapter

2. **Upload a PDF**
   - Click "Upload" in the Files section
   - Select a PDF file
   - Wait for upload to complete

3. **Wait for Flashcards**
   - Flashcards generate automatically in the background
   - The "Flashcards" button will enable when ready
   - No page refresh needed!

4. **Study with Flashcards**
   - Click the "Flashcards" button in the chat interface
   - Navigate with arrow buttons or keyboard (← →)
   - Click a card to flip between question and answer
   - Press ESC to close

5. **Delete File (Optional)**
   - Delete the file if needed
   - Associated flashcards are automatically removed

## 🎯 Key Features

- ✅ **Automatic Generation:** 20 flashcards per PDF
- ✅ **Real-time Updates:** No refresh needed
- ✅ **Interactive UI:** Click to flip, arrow navigation
- ✅ **Keyboard Support:** Arrow keys and ESC
- ✅ **Progress Tracking:** Shows current position
- ✅ **Clean UX:** Smooth animations and transitions

## 🔧 Configuration

### n8n Webhook Endpoint
The feature uses: `https://laithaldaoud.app.n8n.cloud/webhook/flashcards`

To change this, edit:
```typescript
// studai/supabase/functions/file-upload-webhook/index.ts
const flashcardsWebhookUrl = 'YOUR_NEW_WEBHOOK_URL';
```

Then redeploy the edge function.

## 📊 Monitoring

### Check Flashcards in Database
```sql
-- View all flashcards
SELECT * FROM flashcards;

-- Count by chapter
SELECT chapter_id, COUNT(*) 
FROM flashcards 
GROUP BY chapter_id;

-- Check specific file
SELECT * FROM flashcards WHERE file_id = 'your-file-id';
```

### Check Edge Function Logs
```bash
supabase functions logs file-upload-webhook --follow
```

### Common Issues

**Button stays disabled:**
- Check if flashcards were generated in database
- Verify n8n webhook is responding
- Check edge function logs

**Cards not showing:**
- Ensure RLS policies are correct
- Verify user has access to the chapter
- Check browser console for errors

**Webhook failing:**
- Verify n8n endpoint is accessible
- Check signed URL is valid
- Review n8n workflow logs

## 📝 API Examples

### Get Flashcards in Your Code
```typescript
import { getChapterFlashcards, getFileFlashcards } from '@/lib/actions/flashcards';

// Get all flashcards for a chapter
const result = await getChapterFlashcards(chapterId);
if (result.success) {
  console.log(result.data); // FlashcardRow[]
}

// Get flashcards for specific file
const fileResult = await getFileFlashcards(fileId);
if (fileResult.success) {
  console.log(fileResult.data);
}
```

### Subscribe to Realtime Updates
```typescript
const channel = supabase
  .channel('flashcards')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'flashcards',
      filter: `chapter_id=eq.${chapterId}`,
    },
    (payload) => {
      console.log('Flashcard change:', payload);
    }
  )
  .subscribe();
```

## 🎨 UI Components

### Use Flashcard Modal Anywhere
```typescript
import { FlashcardModal } from '@/components/flashcard/FlashcardModal';

<FlashcardModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  flashcards={flashcards}
/>
```

### Use Individual Flashcard
```typescript
import { Flashcard } from '@/components/flashcard/Flashcard';

<Flashcard
  question="What is React?"
  answer="A JavaScript library for building user interfaces"
/>
```

## 📦 Files Reference

### Key Files Created
- **Migration:** `supabase/migrations/20250101000006_flashcards.sql`
- **Actions:** `src/lib/actions/flashcards.ts`
- **Validations:** `src/lib/validations/flashcard.ts`
- **Components:** `src/components/flashcard/`
- **Docs:** `Docs/FLASHCARDS_FEATURE.md`

### Files Modified
- **Webhook:** `supabase/functions/file-upload-webhook/index.ts`
- **File Actions:** `src/lib/actions/files.ts`
- **Chat UI:** `src/components/chat/ChatInterface.tsx`
- **Types:** `src/types/database.ts`

## 🧪 Test Your Setup

1. Upload a PDF file
2. Open browser console
3. Check for log: `"Triggering flashcards generation"`
4. Check for log: `"Successfully inserted X flashcards"`
5. Verify button enables in UI
6. Click button and test navigation

## 📖 Full Documentation

For comprehensive documentation, see:
- **Feature Docs:** `studai/Docs/FLASHCARDS_FEATURE.md`
- **Implementation Summary:** `FLASHCARDS_IMPLEMENTATION_SUMMARY.md`

## ✅ Checklist

Before going live:
- [ ] Database migration applied
- [ ] Edge function deployed
- [ ] n8n webhook is working
- [ ] Tested file upload
- [ ] Verified flashcards generate
- [ ] Tested UI interactions
- [ ] Tested file deletion
- [ ] Checked RLS policies

---

**Need Help?** Check the full documentation in `studai/Docs/FLASHCARDS_FEATURE.md`

