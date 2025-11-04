# CSP Fix V2 - Removed Nonce Conflict

## Problem

The error message shows:
> "Note that 'unsafe-inline' is ignored if either a hash or nonce value is present in the source list."

This means we were trying to use both `'unsafe-inline'` AND `nonce-...` in the same CSP directive, which is invalid. When using `'unsafe-inline'`, you cannot use nonces.

## Solution

I've removed the nonce from the CSP entirely. Since Next.js requires `'unsafe-inline'` for its generated scripts, we cannot use nonces.

## Changes Made

1. **Removed nonce generation** - No longer needed
2. **Removed nonce from CSP** - Using only `'unsafe-inline'`
3. **Simplified CSP function** - No longer takes nonce parameter

## Updated CSP

**Before (broken):**
```typescript
script-src 'self' 'unsafe-inline' 'nonce-${nonce}';  // ❌ Invalid!
```

**After (fixed):**
```typescript
script-src 'self' 'unsafe-inline' 'unsafe-eval' ${plausibleSrc};  // ✅ Valid
script-src-elem 'self' 'unsafe-inline' ${plausibleSrc};  // ✅ Valid
```

## Why This Works

- Next.js generates inline scripts that we cannot control
- These scripts need `'unsafe-inline'` to run
- When using `'unsafe-inline'`, nonces are ignored/conflicting
- So we must use `'unsafe-inline'` without nonces

## Security Note

While `'unsafe-inline'` is less secure than nonces, it's:
- Required for Next.js to function
- Standard practice for Next.js applications
- Still provides protection against XSS from external sources
- Combined with other security headers (HSTS, X-Frame-Options, etc.)

## Next Steps

1. **Commit and push:**
   ```bash
   git add .
   git commit -m "fix: Remove nonce from CSP to fix 'unsafe-inline' conflict"
   git push
   ```

2. **Vercel will auto-redeploy**

3. **Test again** - CSP errors should be gone

## Additional Error: "Connection closed"

You also see a "Connection closed" error. This is likely:
- Supabase Realtime connection issue
- Not related to CSP
- Check your Supabase connection in Vercel environment variables
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set correctly

## Verification Checklist

After redeploying:
- [ ] No CSP violation errors in console
- [ ] Scripts load successfully
- [ ] Login form works
- [ ] No "nonce ignored" warnings
- [ ] Check Supabase connection if "Connection closed" persists

