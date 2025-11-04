# Stage 3: File Upload - Quick Start Testing Guide

**Version:** 1.0  
**Date:** October 30, 2025  
**Estimated Testing Time:** 20-30 minutes

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ Completed Stage 2 setup
- ✅ Development server running (`npm run dev`)
- ✅ Test account created and logged in
- ✅ At least one subject and chapter created
- ✅ PDF file ready for testing (< 50MB)

---

## 🚀 Quick Start

### 1. Navigate to a Chapter

1. **Log in** to your test account
2. **Click on a subject** from the dashboard
3. **Click on a chapter** from the subject page
4. You should now see the chapter page with two sections:
   - **Left:** Files section (with upload area)
   - **Right:** Chat section (placeholder for Stage 4)

---

## 📤 Testing File Upload

### Test 1: Drag-and-Drop Upload

1. **Prepare a test PDF file** (< 50MB)
2. **Drag the file** over the upload area
3. **Observe:** Upload area should highlight with blue border
4. **Drop the file** onto the upload area
5. **Observe:** 
   - File preview appears below upload area
   - File name and size displayed
   - "Upload" and cancel buttons visible
6. **Click "Upload"**
7. **Observe:**
   - Upload button shows "Uploading..." with spinner
   - Progress bar appears and animates
   - After completion, toast notification: "File uploaded successfully!"
   - File appears in the file list below
8. **Result:** ✅ File should be visible in the list

### Test 2: Click to Browse Upload

1. **Click anywhere in the upload area**
2. **Observe:** File browser dialog opens
3. **Select a PDF file** and click "Open"
4. **Observe:** File preview appears (same as drag-and-drop)
5. **Click "Upload"**
6. **Observe:** Same upload flow as Test 1
7. **Result:** ✅ File should be added to the list

### Test 3: Cancel Upload

1. **Select a PDF file** (drag or click)
2. **Observe:** File preview appears
3. **Click the "X" button** (cancel)
4. **Observe:** File preview disappears
5. **Result:** ✅ No upload should occur

---

## ❌ Testing Validation

### Test 4: Invalid File Type

1. **Try uploading a non-PDF file** (e.g., .jpg, .docx, .txt)
2. **Observe:** Error toast: "Only PDF files are allowed"
3. **Result:** ✅ Upload should be prevented

### Test 5: File Too Large

1. **Try uploading a PDF > 50MB**
2. **Observe:** Error toast: "File size must be less than 50MB"
3. **Result:** ✅ Upload should be prevented

### Test 6: Wrong Extension

1. **Try uploading a file named "test.pdf.txt"** or similar
2. **Observe:** Error toast: "File must have .pdf extension"
3. **Result:** ✅ Upload should be prevented

---

## 📥 Testing File Download

### Test 7: Download File

1. **Locate an uploaded file** in the file list
2. **Click the download button** (download icon)
3. **Observe:** 
   - Button shows spinner briefly
   - New browser tab opens
   - PDF displays in browser's PDF viewer
4. **Result:** ✅ File should open correctly

### Test 8: Multiple Downloads

1. **Click download** on a file
2. **Wait for file to open**
3. **Go back and download again**
4. **Observe:** File opens again without issues
5. **Result:** ✅ Can download same file multiple times

---

## 🗑️ Testing File Deletion

### Test 9: Delete File

1. **Locate an uploaded file** in the file list
2. **Click the delete button** (trash icon)
3. **Observe:** Confirmation dialog appears:
   - Title: "Delete File"
   - Description: "Are you sure you want to delete [filename]?"
   - Cancel and Delete buttons
4. **Click "Cancel"**
5. **Observe:** Dialog closes, file still in list
6. **Click delete button again**
7. **Click "Delete"** in the dialog
8. **Observe:**
   - Delete button shows spinner
   - Dialog closes
   - Toast notification: "File deleted successfully"
   - File removed from list
9. **Result:** ✅ File should be removed

---

## 🎨 Testing UI/UX

### Test 10: Empty State

1. **Delete all files** from the chapter (if any exist)
2. **Observe:** Empty state displays:
   - PDF icon
   - "No files yet"
   - "Upload your first PDF to get started"
3. **Result:** ✅ Empty state should show correctly

### Test 11: Loading States

1. **Upload a file**
2. **Observe during upload:**
   - Upload button disabled
   - Spinner visible
   - Progress bar animates
   - Cancel button disabled
3. **Try clicking upload again**
4. **Observe:** Button doesn't respond (disabled)
5. **Result:** ✅ Loading states prevent double-actions

### Test 12: File List Display

1. **Upload 3-5 PDF files**
2. **Observe:** Each file card shows:
   - PDF icon
   - File name (truncated if too long)
   - Upload date and time
   - Download button
   - Delete button
3. **Result:** ✅ All files display correctly

### Test 13: Responsive Design

1. **Resize browser window** to mobile width (< 768px)
2. **Observe:** 
   - Layout switches to single column
   - Files section stacks above chat section
   - Upload area remains functional
   - File cards adjust to smaller width
3. **Result:** ✅ Layout is responsive

---

## 🔐 Testing Security

### Test 14: Cross-User Access

**Setup:**
1. Create two test accounts (User A and User B)
2. Upload files as User A

**Test:**
1. **Log out from User A**
2. **Log in as User B**
3. **Navigate to User A's chapter** (if possible)
4. **Observe:** 
   - Chapter page should show "not found" or empty
   - User B cannot see User A's files
5. **Result:** ✅ Files are user-scoped

### Test 15: Direct URL Access

1. **Upload a file as User A**
2. **Copy the file's storage path** (from browser dev tools network tab)
3. **Log out and log in as User B**
4. **Try to access the file directly** via storage URL
5. **Observe:** Access denied or 403 error
6. **Result:** ✅ Storage RLS prevents unauthorized access

---

## 🐛 Common Issues & Solutions

### Issue 1: "Unauthorized" Error

**Symptom:** Upload fails with "Unauthorized" error

**Solution:**
- Check if you're logged in
- Clear browser cache and cookies
- Log out and log back in

### Issue 2: File Not Appearing in List

**Symptom:** Upload succeeds but file doesn't show

**Solution:**
- Refresh the page manually
- Check browser console for errors
- Verify database has RLS policies enabled

### Issue 3: Download Opens Blank Tab

**Symptom:** Download button opens blank tab

**Solution:**
- Check browser's popup blocker settings
- Allow popups for the site
- Try right-click → "Open in new tab"

### Issue 4: Upload Stuck at 90%

**Symptom:** Progress bar stuck at 90%

**Solution:**
- Wait up to 30 seconds (large files take time)
- Check network connection
- Check browser console for errors
- Try refreshing and uploading again

---

## 📊 Expected Behavior Summary

| Action | Expected Result | Time |
|--------|----------------|------|
| Drag file over area | Blue highlight appears | Instant |
| Drop file | File preview shows | Instant |
| Click Upload | Progress bar animates | 2-10s |
| Upload complete | Toast + file in list | Instant |
| Click Download | New tab with PDF | 1-2s |
| Click Delete | Confirmation dialog | Instant |
| Confirm Delete | File removed + toast | 1-2s |
| Invalid file type | Error toast | Instant |
| File too large | Error toast | Instant |

---

## ✅ Testing Completion Checklist

Before moving to Stage 4, ensure all tests pass:

- [ ] ✅ Drag-and-drop upload works
- [ ] ✅ Click-to-browse upload works
- [ ] ✅ Cancel upload works
- [ ] ✅ Invalid file type rejected
- [ ] ✅ Large file rejected
- [ ] ✅ Wrong extension rejected
- [ ] ✅ Download opens file correctly
- [ ] ✅ Delete with confirmation works
- [ ] ✅ Empty state displays
- [ ] ✅ Loading states work
- [ ] ✅ File list displays correctly
- [ ] ✅ Responsive on mobile
- [ ] ✅ Cross-user access prevented
- [ ] ✅ Storage RLS enforced

---

## 🎬 Next Steps

If all tests pass:
1. ✅ **Mark Stage 3 as complete**
2. 🚀 **Proceed to Stage 4**: Chat Interface & LLM Integration

If tests fail:
1. 📝 Document the failing test
2. 🔍 Check browser console for errors
3. 🐛 Debug and fix issues
4. 🔄 Re-run tests

---

## 📞 Support

If you encounter issues:

1. **Check browser console** (F12) for error messages
2. **Check Supabase logs** in the dashboard
3. **Verify environment variables** are set correctly
4. **Check RLS policies** are enabled in Supabase
5. **Review error logs** in terminal where dev server is running

---

## 🎓 What You're Testing

This testing guide validates:

- **File Upload:** User can upload PDF files
- **File Storage:** Files stored securely in Supabase
- **File Download:** Signed URLs provide secure access
- **File Deletion:** Files removed from storage and database
- **Validation:** Invalid files rejected appropriately
- **Security:** Users can only access their own files
- **UX:** Loading states, progress indicators, notifications
- **Responsive:** Works on all device sizes

---

**Happy Testing! 🎉**

If all tests pass, Stage 3 is ready for production! 🚀

---

**Guide Version:** 1.0  
**Last Updated:** October 30, 2025  
**Estimated Duration:** 20-30 minutes


