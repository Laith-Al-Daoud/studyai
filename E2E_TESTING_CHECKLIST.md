# End-to-End Testing Checklist

**Version:** 1.0  
**Date:** November 4, 2025

---

## Overview

This checklist covers all user flows in the StudAI application. Use this for manual testing before production deployment or when verifying major changes.

---

## Testing Environment Setup

- [ ] Local development server running (`npm run dev`)
- [ ] Supabase instance configured and connected
- [ ] n8n workflows active and configured
- [ ] Clean test database (or use test account)
- [ ] Test files ready (sample PDFs and PPTX)

---

## 1. Authentication Flow

### Registration

- [ ] **Navigate to registration page** (`/register`)
- [ ] **Enter invalid email** (e.g., "notanemail")
  - Expected: Validation error displayed
- [ ] **Enter password < 6 characters**
  - Expected: Validation error displayed
- [ ] **Enter mismatched passwords**
  - Expected: "Passwords don't match" error
- [ ] **Enter valid credentials**
  - Email: `test@example.com`
  - Password: `password123`
  - Confirm: `password123`
- [ ] **Click "Sign Up"**
  - Expected: Redirect to `/dashboard`
  - Expected: Success toast notification
- [ ] **Verify user is logged in**
  - Expected: User avatar/email in header
  - Expected: Session persists on page reload

### Login

- [ ] **Log out from current session**
- [ ] **Navigate to login page** (`/login`)
- [ ] **Enter incorrect credentials**
  - Expected: Error message displayed
- [ ] **Enter correct credentials**
  - Email: `test@example.com`
  - Password: `password123`
- [ ] **Click "Sign In"**
  - Expected: Redirect to `/dashboard`
  - Expected: User logged in successfully
- [ ] **Refresh page**
  - Expected: Session persists
  - Expected: Still logged in

### Password Reset (if implemented)

- [ ] **Navigate to password reset** (`/reset-password`)
- [ ] **Enter invalid email**
  - Expected: Validation error
- [ ] **Enter valid email**
- [ ] **Submit form**
  - Expected: Success message
  - Expected: Email sent (check inbox)

### Session Persistence

- [ ] **Log in to application**
- [ ] **Reload page (F5)**
  - Expected: Still logged in
- [ ] **Close browser and reopen**
  - Expected: Session restored (if "Remember me")
- [ ] **Open in incognito/private window**
  - Expected: Not logged in
  - Expected: Redirect to `/login` for protected routes

### Logout

- [ ] **Click logout button**
  - Expected: Redirect to `/login` or home
  - Expected: Session cleared
- [ ] **Attempt to access protected route**
  - Expected: Redirect to `/login`

**Result:** ✅ Pass / ❌ Fail  
**Notes:**

---

## 2. Subject Management Flow

### View Subjects

- [ ] **Log in and navigate to dashboard**
- [ ] **Verify empty state** (if no subjects)
  - Expected: "No subjects yet" message
  - Expected: "Create Subject" button visible

### Create Subject

- [ ] **Click "Create Subject" button**
  - Expected: Modal/form opens
- [ ] **Leave title empty and submit**
  - Expected: Validation error
- [ ] **Enter title > 100 characters**
  - Expected: Validation error
- [ ] **Enter valid title** (e.g., "Mathematics")
- [ ] **Click "Create"**
  - Expected: Modal closes
  - Expected: Subject appears in list
  - Expected: Success toast notification
- [ ] **Create 2-3 more subjects**
  - Subjects: "Physics", "Chemistry", "Biology"
  - Expected: All subjects appear in list

### Edit Subject

- [ ] **Click edit icon on a subject**
  - Expected: Edit modal opens
  - Expected: Current title pre-filled
- [ ] **Change title** (e.g., "Mathematics" → "Advanced Mathematics")
- [ ] **Click "Save"**
  - Expected: Modal closes
  - Expected: Subject title updated in list
  - Expected: Success toast notification
- [ ] **Reload page**
  - Expected: Updated title persists

### Delete Subject

- [ ] **Click delete icon on a subject**
  - Expected: Confirmation dialog appears
- [ ] **Click "Cancel"**
  - Expected: Dialog closes
  - Expected: Subject still in list
- [ ] **Click delete icon again**
- [ ] **Click "Confirm"**
  - Expected: Subject removed from list
  - Expected: Success toast notification
- [ ] **Reload page**
  - Expected: Subject still deleted (persists)

### Subject List Order

- [ ] **Verify subjects are sorted** (newest first or alphabetically)
- [ ] **Create new subject**
  - Expected: Appears in correct position

**Result:** ✅ Pass / ❌ Fail  
**Notes:**

---

## 3. Chapter Management Flow

### View Chapters

- [ ] **Click on a subject from dashboard**
  - Expected: Navigate to subject detail page
  - Expected: URL is `/subject/[subject-id]`
- [ ] **Verify empty state** (if no chapters)
  - Expected: "No chapters yet" message
  - Expected: "Create Chapter" button visible

### Create Chapter

- [ ] **Click "Create Chapter" button**
  - Expected: Modal/form opens
- [ ] **Leave title empty and submit**
  - Expected: Validation error
- [ ] **Enter valid title** (e.g., "Chapter 1: Introduction")
- [ ] **Click "Create"**
  - Expected: Modal closes
  - Expected: Chapter appears in list
  - Expected: Success toast
- [ ] **Create 2-3 more chapters**
  - Chapters: "Chapter 2", "Chapter 3"
  - Expected: All chapters appear

### Edit Chapter

- [ ] **Click edit icon on chapter**
  - Expected: Edit modal opens
- [ ] **Change title**
- [ ] **Click "Save"**
  - Expected: Title updated
  - Expected: Success toast

### Delete Chapter

- [ ] **Click delete icon on chapter**
- [ ] **Confirm deletion**
  - Expected: Chapter removed from list
  - Expected: Success toast

### Navigate to Chapter

- [ ] **Click on a chapter card**
  - Expected: Navigate to chapter detail page
  - Expected: URL is `/chapter/[chapter-id]`
  - Expected: Chapter title displayed
  - Expected: File upload area visible
  - Expected: Chat interface visible

**Result:** ✅ Pass / ❌ Fail  
**Notes:**

---

## 4. File Upload Flow

### Upload PDF File

- [ ] **Navigate to a chapter detail page**
- [ ] **Verify file upload area is visible**
- [ ] **Attempt to upload non-PDF file** (e.g., .txt, .jpg)
  - Expected: Validation error
- [ ] **Select PDF file (< 50MB)**
  - Method: Click "Upload" or drag-and-drop
- [ ] **Verify upload progress indicator**
  - Expected: Progress bar or spinner
- [ ] **Wait for upload to complete**
  - Expected: File appears in file list
  - Expected: Success toast notification
  - Expected: File name displayed
  - Expected: Upload date/time shown
- [ ] **Upload another PDF file**
  - Expected: Both files in list

### Upload PPTX File

- [ ] **Select PPTX file**
  - Use test .pptx or .ppt file
- [ ] **Wait for upload**
  - Expected: "Converting..." message (optional)
  - Expected: File converts to PDF
  - Expected: PDF appears in file list
  - Expected: Original PPTX name preserved

### Large File Upload

- [ ] **Attempt to upload file > 50MB**
  - Expected: Validation error
  - Expected: "File size must be less than 50MB" message

### Multiple File Upload

- [ ] **Upload 3-5 files to same chapter**
  - Mix of PDFs and PPTX
  - Expected: All files appear in list
  - Expected: Files listed in chronological order

### File List Display

- [ ] **Verify file list shows:**
  - [ ] File name
  - [ ] Upload date/time
  - [ ] Delete button
  - [ ] File icon/type indicator

### Delete File

- [ ] **Click delete icon on a file**
- [ ] **Confirm deletion**
  - Expected: File removed from list
  - Expected: File removed from storage
  - Expected: Success toast
- [ ] **Reload page**
  - Expected: File still deleted

### Edge Cases

- [ ] **Upload same file twice**
  - Expected: Both uploads succeed
  - Expected: Files may have different URLs
- [ ] **Upload during poor connection**
  - Expected: Retry or error handling
- [ ] **Upload and navigate away**
  - Expected: Upload continues or cancels gracefully

**Result:** ✅ Pass / ❌ Fail  
**Notes:**

---

## 5. Chat Interface Flow

### Initial Chat State

- [ ] **Navigate to chapter with uploaded files**
- [ ] **Verify chat interface is visible**
- [ ] **Verify empty state** (if no messages)
  - Expected: "Start a conversation" message
- [ ] **Verify message input is functional**

### Send First Message

- [ ] **Type message in input**
  - Message: "What is this chapter about?"
- [ ] **Click send button or press Enter**
  - Expected: Message appears in chat (user bubble)
  - Expected: Input clears
  - Expected: Loading indicator for AI response
- [ ] **Wait for AI response**
  - Expected: AI response appears (assistant bubble)
  - Expected: Response is relevant to uploaded files
  - Expected: Loading indicator disappears

### Chat History

- [ ] **Send multiple messages** (3-5 messages)
  - Various questions about the content
- [ ] **Verify all messages persist**
  - Expected: Messages in chronological order
  - Expected: User messages on right (or left)
  - Expected: AI messages on opposite side
- [ ] **Reload page**
  - Expected: All messages still visible
  - Expected: Chat history persists

### Realtime Updates

- [ ] **Open same chapter in two browser windows**
- [ ] **Send message in window 1**
  - Expected: Message appears in window 2 (realtime)
  - Expected: AI response appears in both windows

### Long Conversations

- [ ] **Send 10+ messages**
- [ ] **Verify scroll behavior**
  - Expected: Auto-scroll to latest message
  - Expected: Can scroll up to view history
  - Expected: New messages don't break scroll

### Message Input

- [ ] **Test empty message**
  - Expected: Cannot send empty message
- [ ] **Test very long message**
  - Expected: Message accepted (or max length enforced)
- [ ] **Test multiline message** (Shift+Enter)
  - Expected: Textarea expands
  - Expected: Message preserves line breaks

### AI Response Quality

- [ ] **Ask chapter-specific question**
  - Expected: Response references uploaded files
- [ ] **Ask general question**
  - Expected: Relevant response
- [ ] **Test with no files uploaded**
  - Expected: AI responds (may indicate no context)

### Error Handling

- [ ] **Disconnect internet**
- [ ] **Send message**
  - Expected: Error notification
  - Expected: Retry option available
- [ ] **Reconnect and retry**
  - Expected: Message sends successfully

**Result:** ✅ Pass / ❌ Fail  
**Notes:**

---

## 6. Flashcard Generation Flow

### Generate Flashcards

- [ ] **Navigate to chapter with uploaded files**
- [ ] **Click "Generate Flashcards" button**
  - Expected: Loading indicator
  - Expected: "Generating flashcards..." message
- [ ] **Wait for generation to complete**
  - Expected: Flashcards appear
  - Expected: Success toast notification
  - Expected: Number of flashcards shown (e.g., "10 flashcards")

### View Flashcards

- [ ] **Verify flashcard display**
  - Expected: One flashcard visible at a time
  - Expected: Question/front side shown first
  - Expected: Navigation arrows visible
- [ ] **Click on flashcard**
  - Expected: Card flips to show answer
  - Expected: Flip animation plays
- [ ] **Click again**
  - Expected: Card flips back to question

### Navigate Flashcards

- [ ] **Click "Next" button/arrow**
  - Expected: Next flashcard appears
  - Expected: Card resets to question side
- [ ] **Click "Previous" button/arrow**
  - Expected: Previous flashcard appears
- [ ] **Navigate to last flashcard**
  - Expected: "Next" button disabled or cycles to first
- [ ] **Navigate to first flashcard**
  - Expected: "Previous" button disabled

### Flashcard Content

- [ ] **Verify flashcards are relevant**
  - Expected: Questions from uploaded file content
  - Expected: Answers are accurate
  - Expected: Good variety of questions

### Delete Flashcard

- [ ] **Click delete icon on flashcard**
- [ ] **Confirm deletion**
  - Expected: Flashcard removed
  - Expected: Next flashcard appears
  - Expected: Success toast
- [ ] **Reload page**
  - Expected: Deleted flashcard still gone

### Delete All Flashcards

- [ ] **Delete all flashcards one by one**
  - Expected: Empty state appears
  - Expected: "Generate Flashcards" button still available

### Regenerate Flashcards

- [ ] **Generate flashcards again**
  - Expected: New set of flashcards created
  - Expected: May be different from first set

### Flashcard Persistence

- [ ] **Generate flashcards**
- [ ] **Navigate away from chapter**
- [ ] **Return to chapter**
  - Expected: Flashcards still available
  - Expected: Same flashcards as before

**Result:** ✅ Pass / ❌ Fail  
**Notes:**

---

## 7. PDF Viewer Flow (if implemented)

### Open PDF Viewer

- [ ] **Click on a file from file list**
  - Expected: PDF viewer opens
  - Expected: PDF loads and displays

### PDF Viewing Features

- [ ] **Zoom in/out**
  - Expected: PDF scales correctly
- [ ] **Navigate pages**
  - Expected: Can go to next/previous page
- [ ] **Scroll through document**
  - Expected: Smooth scrolling

### Close PDF Viewer

- [ ] **Click close/back button**
  - Expected: Returns to chapter view

**Result:** ✅ Pass / ❌ Fail  
**Notes:**

---

## 8. Responsive Design Testing

### Desktop (> 1024px)

- [ ] **Test on large screen**
  - Expected: Layout uses full width appropriately
  - Expected: All features accessible
  - Expected: No horizontal scroll

### Tablet (768px - 1024px)

- [ ] **Resize browser to tablet size**
  - Expected: Layout adapts
  - Expected: Navigation remains accessible
  - Expected: All features functional

### Mobile (< 768px)

- [ ] **Resize to mobile size**
  - Expected: Mobile navigation (hamburger menu)
  - Expected: Single column layout
  - Expected: Touch-friendly buttons
  - Expected: All features accessible
- [ ] **Test on actual mobile device**
  - Expected: Touch gestures work
  - Expected: Virtual keyboard doesn't break layout

**Result:** ✅ Pass / ❌ Fail  
**Notes:**

---

## 9. Security Testing

### Authentication Protection

- [ ] **Log out**
- [ ] **Attempt to access `/dashboard`**
  - Expected: Redirect to `/login`
- [ ] **Attempt to access `/subject/[id]`**
  - Expected: Redirect to `/login`
- [ ] **Attempt to access `/chapter/[id]`**
  - Expected: Redirect to `/login`

### User Data Isolation

- [ ] **Create User A** (`usera@example.com`)
- [ ] **Create subject and chapter as User A**
- [ ] **Note the chapter ID from URL**
- [ ] **Log out**
- [ ] **Create User B** (`userb@example.com`)
- [ ] **Attempt to access User A's chapter URL**
  - Expected: 404 or redirect
  - Expected: No access to User A's data
- [ ] **Verify User B cannot see User A's subjects**

### File Access Control

- [ ] **Upload file as User A**
- [ ] **Copy file URL from network tab**
- [ ] **Log out**
- [ ] **Attempt to access file URL as User B**
  - Expected: Access denied
  - Expected: Signed URL expired or unauthorized

**Result:** ✅ Pass / ❌ Fail  
**Notes:**

---

## 10. Error Handling

### Network Errors

- [ ] **Disconnect internet**
- [ ] **Attempt any action**
  - Expected: Error message displayed
  - Expected: Graceful degradation

### Invalid Data

- [ ] **Manually enter invalid URL**
  - URL: `/chapter/invalid-uuid`
  - Expected: 404 page or redirect
- [ ] **Access deleted resource**
  - Expected: 404 or "Not found" message

### JavaScript Errors

- [ ] **Check browser console**
  - Expected: No errors in normal operation
  - Expected: Error boundary catches component errors

**Result:** ✅ Pass / ❌ Fail  
**Notes:**

---

## 11. Performance Testing

### Page Load Times

- [ ] **Measure dashboard load time**
  - Expected: < 2 seconds
- [ ] **Measure chapter page load time**
  - Expected: < 2 seconds
- [ ] **Test with slow 3G connection**
  - Expected: Acceptable performance with loading states

### Large Data Sets

- [ ] **Create 10+ subjects**
- [ ] **Create 10+ chapters in one subject**
- [ ] **Upload 10+ files to one chapter**
- [ ] **Verify performance remains acceptable**

### Chat Performance

- [ ] **Send 20+ messages**
- [ ] **Verify chat remains responsive**
- [ ] **Check memory usage (DevTools)**

**Result:** ✅ Pass / ❌ Fail  
**Notes:**

---

## Testing Summary

### Overall Results

| Flow | Status | Notes |
|------|--------|-------|
| Authentication | ⬜ Pass / Fail | |
| Subject Management | ⬜ Pass / Fail | |
| Chapter Management | ⬜ Pass / Fail | |
| File Upload | ⬜ Pass / Fail | |
| Chat Interface | ⬜ Pass / Fail | |
| Flashcards | ⬜ Pass / Fail | |
| PDF Viewer | ⬜ Pass / Fail | |
| Responsive Design | ⬜ Pass / Fail | |
| Security | ⬜ Pass / Fail | |
| Error Handling | ⬜ Pass / Fail | |
| Performance | ⬜ Pass / Fail | |

### Critical Issues Found

- [ ] No critical issues
- [ ] Issues found (list below):

### Minor Issues Found

- [ ] No minor issues
- [ ] Issues found (list below):

---

## Tester Information

- **Tester Name:**
- **Date Tested:**
- **Environment:**
  - Browser:
  - OS:
  - Screen Size:
  - Network:

---

**Testing Complete:** ⬜ Yes / ⬜ No  
**Ready for Production:** ⬜ Yes / ⬜ No


