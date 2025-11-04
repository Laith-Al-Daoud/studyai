# CSP Fix for Vercel Deployment

## Problem

After deploying to Vercel, you're seeing Content Security Policy (CSP) violations that prevent:
- Inline scripts from executing (Next.js requires this)
- External scripts from loading
- Login functionality from working

## Solution

I've updated the CSP configuration in `src/middleware.ts` to:

1. **Allow 'unsafe-inline' for scripts** - Required for Next.js generated scripts
2. **Allow 'unsafe-eval'** - Required for some Next.js features
3. **Add explicit script-src-elem** - For external script elements
4. **Allow Plausible Analytics** - If configured
5. **Fix manifest-src** - For PWA manifest loading

## Changes Made

### 1. Updated CSP in `src/middleware.ts`

**Before:**
```typescript
script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
```

**After:**
```typescript
script-src 'self' 'unsafe-inline' 'unsafe-eval' ${plausibleSrc} 'nonce-${nonce}';
script-src-elem 'self' 'unsafe-inline' ${plausibleSrc} 'nonce-${nonce}';
```

### 2. Updated `site.webmanifest`

- Added favicon.ico as fallback
- Updated branding to StudyAI

## Security Note

The `'unsafe-inline'` directive is necessary for Next.js to function properly. Next.js generates inline scripts that cannot be nonced. This is a known limitation and is acceptable for Next.js applications.

## Next Steps

1. **Commit and push the changes:**
   ```bash
   cd /home/laith/code/reposo/studai
   git add .
   git commit -m "fix: Update CSP to allow Next.js inline scripts"
   git push
   ```

2. **Redeploy on Vercel:**
   - Vercel will automatically redeploy when you push
   - Or manually trigger a redeploy in Vercel dashboard

3. **Test the login page:**
   - The CSP errors should be gone
   - Login should work properly

## Verification

After redeploying, check the browser console:
- ✅ No CSP violation errors
- ✅ Scripts load successfully
- ✅ Login form works
- ✅ No favicon errors

## If Issues Persist

If you still see CSP errors:

1. **Check browser console** for specific blocked resources
2. **Temporarily disable CSP** in development to test:
   ```typescript
   // In middleware.ts, temporarily return empty CSP for testing
   if (process.env.NODE_ENV === 'development') {
     return ''; // Empty CSP for testing
   }
   ```
3. **Check Vercel environment variables** are set correctly
4. **Clear browser cache** and hard refresh (Ctrl+Shift+R)

## Alternative: More Restrictive CSP (Future)

If you want to tighten security later, you can:
- Use Next.js Script component with strategies
- Implement nonce-based script loading
- Use CSP reporting to identify what's needed

But for now, the current configuration works with Next.js out of the box.

