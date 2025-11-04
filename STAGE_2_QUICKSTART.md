# Stage 2 Quick Start Guide

This guide will help you set up and test the authentication and data management features implemented in Stage 2.

## Prerequisites

Before starting, ensure you have:

- ✅ Node.js 20.9+ installed
- ✅ A Supabase account and project created
- ✅ All Stage 1 migrations applied to your Supabase database
- ✅ npm installed

## Setup Steps

### 1. Install Dependencies

```bash
cd studai
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the `studai` directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Where to find your credentials:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the Project URL and anon/public key

### 3. Verify Database Setup

Ensure all migrations are applied:

```bash
# If using Supabase CLI
supabase db push

# Or run each migration file manually in Supabase SQL Editor
```

Required tables:
- `subjects` (with RLS policies)
- `chapters` (with RLS policies)
- `files` (for Stage 3)
- `chats` (for Stage 4)

### 4. Start Development Server

```bash
npm run dev
```

The app should now be running at [http://localhost:3000](http://localhost:3000)

## Testing Authentication

### Test 1: User Registration

1. Navigate to http://localhost:3000
2. Click "Get Started" or "Sign In"
3. Click "Sign up" link
4. Enter a valid email and password (min 6 characters)
5. Confirm password must match
6. Click "Create Account"

**Expected Result:**
- ✅ Success toast appears
- ✅ Redirected to login page
- ✅ Email verification sent to inbox

**Common Issues:**
- **"Invalid email"**: Ensure proper email format
- **"Password too short"**: Must be 6+ characters
- **"Passwords don't match"**: Check confirm password field

### Test 2: Email Verification

1. Check your email inbox
2. Click the verification link from Supabase
3. You'll be redirected to the app

**Expected Result:**
- ✅ Redirected to login or dashboard
- ✅ Account is now verified

### Test 3: Login

1. Go to http://localhost:3000/login
2. Enter your registered email and password
3. Click "Sign In"

**Expected Result:**
- ✅ Success toast appears
- ✅ Redirected to /dashboard
- ✅ Header shows your email

**Common Issues:**
- **"Invalid login credentials"**: Check email/password
- **"Email not confirmed"**: Verify email first
- **Stuck on login**: Check browser console for errors

### Test 4: Password Reset

1. Go to http://localhost:3000/reset-password
2. Enter your email
3. Click "Send Reset Link"
4. Check your email
5. Click the reset link
6. Enter new password

**Expected Result:**
- ✅ Success message shown
- ✅ Reset email received
- ✅ Can log in with new password

### Test 5: Logout

1. When logged in, click your avatar in the header
2. Click "Log out"

**Expected Result:**
- ✅ Redirected to /login
- ✅ Session cleared
- ✅ Cannot access /dashboard without logging in

## Testing Data Management

### Test 6: Create Subject

1. Log in and go to /dashboard
2. Click "New Subject" button
3. Enter a subject title (e.g., "Mathematics")
4. Click "Create Subject"

**Expected Result:**
- ✅ Success toast appears
- ✅ Modal closes
- ✅ Subject card appears in the grid
- ✅ Subject shows creation date

**Common Issues:**
- **"Title is required"**: Enter a title
- **Nothing happens**: Check browser console for RLS policy errors

### Test 7: View Subject Details

1. From the dashboard, click on a subject card
2. You should be redirected to `/subject/[id]`

**Expected Result:**
- ✅ Subject title displayed
- ✅ "Back to Dashboard" button works
- ✅ "New Chapter" button visible
- ✅ Empty state shown if no chapters

### Test 8: Create Chapter

1. Navigate to a subject detail page
2. Click "New Chapter" button
3. Enter a chapter title (e.g., "Chapter 1: Introduction")
4. Click "Create Chapter"

**Expected Result:**
- ✅ Success toast appears
- ✅ Modal closes
- ✅ Chapter card appears in the grid
- ✅ Chapter shows creation date

### Test 9: Delete Chapter

1. On a subject detail page with chapters
2. Click the three-dot menu on a chapter card
3. Click "Delete"
4. Confirm the deletion

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ Dialog explains consequences
- ✅ Chapter is removed after confirmation
- ✅ Success toast appears

### Test 10: Delete Subject

1. From the dashboard, click the three-dot menu on a subject card
2. Click "Delete"
3. Confirm the deletion

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ Warning about deleting chapters too
- ✅ Subject is removed after confirmation
- ✅ Success toast appears

### Test 11: Navigation

1. Test the "Back to Dashboard" button on subject pages
2. Click the app logo to return to dashboard
3. Test breadcrumb navigation

**Expected Result:**
- ✅ All navigation links work
- ✅ No 404 errors
- ✅ History navigation works (browser back/forward)

### Test 12: Protected Routes

1. Log out
2. Try to access `/dashboard` directly
3. Try to access `/subject/[any-id]` directly

**Expected Result:**
- ✅ Redirected to /login
- ✅ Can still access / (landing page)
- ✅ Can still access /register
- ✅ After login, redirected to originally requested page

## Testing UI/UX

### Test 13: Responsive Design

Test on different screen sizes:

1. Desktop (1920x1080)
2. Tablet (768x1024)
3. Mobile (375x667)

**Expected Result:**
- ✅ Layout adapts to screen size
- ✅ Cards stack on mobile
- ✅ Forms are usable on all sizes
- ✅ No horizontal scroll

### Test 14: Loading States

1. Refresh the dashboard
2. Watch for loading skeletons
3. Test with slow network (Chrome DevTools → Network → Slow 3G)

**Expected Result:**
- ✅ Skeleton loaders shown while fetching
- ✅ No flash of empty state
- ✅ Content appears smoothly

### Test 15: Error Handling

Test various error scenarios:

1. Submit empty forms
2. Submit invalid emails
3. Use mismatched passwords
4. Try to create items with very long titles

**Expected Result:**
- ✅ Validation errors shown inline
- ✅ Red error text appears
- ✅ Form prevents submission
- ✅ Clear error messages

### Test 16: Toast Notifications

Verify toasts appear for:

1. Successful login
2. Successful registration
3. Subject created
4. Chapter created
5. Subject deleted
6. Chapter deleted
7. Any errors

**Expected Result:**
- ✅ Toasts appear in bottom-right
- ✅ Green for success, red for errors
- ✅ Toasts auto-dismiss after ~3s
- ✅ Can manually dismiss toasts

## Common Issues & Solutions

### Issue: "Invalid JWT" or session errors

**Solution:**
1. Clear browser cookies
2. Log out and log in again
3. Check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correct

### Issue: RLS policy errors (403 Forbidden)

**Solution:**
1. Verify all migrations are applied
2. Check that RLS is enabled on tables
3. Verify policies exist for INSERT, SELECT, DELETE
4. Ensure user is authenticated

### Issue: Email not sending

**Solution:**
1. Check Supabase email settings
2. Verify SMTP configuration (if custom)
3. Check spam folder
4. Use Supabase's development email service

### Issue: Build errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

### Issue: TypeScript errors

**Solution:**
```bash
# Regenerate types from Supabase
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

## Verification Checklist

Before proceeding to Stage 3, verify:

- [ ] Can register new users
- [ ] Can log in successfully
- [ ] Can reset password
- [ ] Can log out
- [ ] Can create subjects
- [ ] Can view subject list
- [ ] Can delete subjects
- [ ] Can create chapters in subjects
- [ ] Can view chapter list
- [ ] Can delete chapters
- [ ] Protected routes redirect properly
- [ ] Toast notifications work
- [ ] Form validation works
- [ ] Loading states appear
- [ ] Responsive on mobile
- [ ] No console errors
- [ ] No linting errors

## Running Linter

Check for any code quality issues:

```bash
npm run lint
```

Expected output: **No errors**

## Building for Production

Test the production build:

```bash
npm run build
npm run start
```

The app should build without errors and run in production mode.

## Next Steps

Once all tests pass, you're ready for **Stage 3: File Upload**!

Stage 3 will add:
- PDF file upload functionality
- File storage in Supabase
- File list display
- File download/delete

## Support

If you encounter issues:

1. Check the browser console for errors
2. Check Supabase logs in the dashboard
3. Verify environment variables are correct
4. Review the STAGE_2_SUMMARY.md for detailed implementation notes

## Database Inspection

To inspect your data directly:

1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. View the following tables:
   - `auth.users` - Registered users
   - `subjects` - Created subjects
   - `chapters` - Created chapters

Verify that:
- User IDs match in subjects
- Subject IDs match in chapters
- RLS policies are active
- Timestamps are correct

---

**Last Updated:** October 30, 2025  
**Stage:** 2 - Authentication & Data Management  
**Status:** ✅ Complete

