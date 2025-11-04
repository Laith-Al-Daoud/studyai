# Fix for "Invalid Refresh Token" Error

## Problem

You're seeing this error when running `npm run dev`:
```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
```

This happens when:
1. You have old/stale cookies from a previous session
2. The Supabase project was reset or changed
3. The refresh token expired or is invalid

## Solution Applied

I've updated the middleware to:
1. **Catch and handle refresh token errors gracefully**
2. **Automatically clear invalid cookies**
3. **Continue without breaking the app**

## Quick Fix (Clear Cookies)

The easiest fix is to clear your browser cookies:

### Option 1: Clear Cookies in Browser
1. Open Developer Tools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Cookies** → `http://localhost:3000`
4. Delete all cookies (especially ones starting with `sb-`)
5. Refresh the page

### Option 2: Clear All Site Data
1. Open Developer Tools (F12)
2. Go to **Application** tab
3. Click **Clear storage** on the left
4. Check **Cookies** and **Local storage**
5. Click **Clear site data**
6. Refresh the page

### Option 3: Use Incognito/Private Window
- Open a new incognito/private window
- Navigate to `http://localhost:3000`
- This will have no cookies

## What Changed in Code

The middleware now:
```typescript
// Before: Would throw error if refresh token invalid
const { data: { user } } = await supabase.auth.getUser()

// After: Catches errors and clears invalid tokens
try {
  const { data, error } = await supabase.auth.getUser()
  if (error && error.message?.includes('refresh_token')) {
    // Clear invalid cookies
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
  }
} catch (error) {
  // Handle gracefully
}
```

## Middleware Deprecation Warning

You're also seeing:
> "The 'middleware' file convention is deprecated. Please use 'proxy' instead."

**This is just a warning** - your middleware still works! In Next.js 16+, you can optionally rename `middleware.ts` to `proxy.ts`, but it's not required.

To fix the warning (optional):
```bash
cd studai
mv src/middleware.ts src/proxy.ts
```

## Verification

After clearing cookies:
- ✅ No more "Invalid Refresh Token" errors
- ✅ App loads normally
- ✅ You can log in fresh
- ✅ Middleware handles errors gracefully

## If Issues Persist

1. **Check environment variables:**
   ```bash
   # Make sure these are set in .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. **Check Supabase project:**
   - Make sure your Supabase project is active
   - Verify the URL matches your `.env.local`

## Summary

The error is now handled gracefully in code, but the easiest fix is to **clear your browser cookies**. This is a one-time fix - after clearing, you'll need to log in again, but the error won't appear anymore.

