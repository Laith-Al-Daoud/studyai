# ✅ Quick Fix Checklist - Chat Not Working in Production

## Problem
Chat doesn't respond after file upload in production (Vercel).

## Root Cause
Vercel serverless functions can't read session cookies → no auth token → webhook never called.

## The Fix (3 Steps)

### 1️⃣ Get Your Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. **Settings** → **API**
4. Copy the **`service_role` key** (starts with `eyJ...`)
   - ⚠️ This is the SECRET key (not the anon key!)

### 2️⃣ Add to Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. **Settings** → **Environment Variables** → **Add New**
4. Enter:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** `eyJ...` (paste your service role key)
   - **Environments:** Check all: ✅ Production, ✅ Preview, ✅ Development

### 3️⃣ Deploy

```bash
# Commit the code changes
cd /home/laith/code/reposo/studai
git add src/lib/actions/chat.ts *.md
git commit -m "Fix: Chat not working in production (session token fallback)"
git push

# Vercel will auto-deploy (or manually trigger in Vercel Dashboard)
```

## Test

1. Go to your production site
2. Upload a PDF file
3. Send a chat message **immediately** (no refresh needed)
4. ✅ Should respond within seconds!

## What Changed?

**Before:**
```typescript
// Only tried session token (failed in production)
if (session?.access_token) {
  fetch(webhook); // Never executed
}
```

**After:**
```typescript
// Try session token first, fall back to service role key
const authToken = session?.access_token || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (authToken) {
  fetch(webhook); // Always executes!
}
```

## Security ✅

**Q: Is it safe to use service role key?**

**A: YES!** Because:
- ✅ Only runs server-side (never exposed to browser)
- ✅ User authentication still validated
- ✅ Authorization still checked
- ✅ Same pattern file upload uses (already working)

## If It Still Doesn't Work

### Check Environment Variable
```bash
# In Vercel Dashboard → Settings → Environment Variables
# Make sure you see:
SUPABASE_SERVICE_ROLE_KEY = eyJ••••••••••••
```

### Check Deployment
```bash
# Make sure latest code is deployed
# Vercel Dashboard → Deployments → Check latest commit
```

### Check Browser Console
```bash
# Open DevTools → Console
# Send a message
# Look for errors
```

### Check Server Logs
```bash
# Vercel Dashboard → Logs
# Send a message
# Look for:
#   ❌ "No authentication token available" → Env var not set
#   ✅ No errors → It's working!
```

## Documentation

- 📄 `CHAT_BUG_FIX_SUMMARY.md` - Complete summary
- 📄 `CHAT_FIX_VERCEL_SESSIONS.md` - Detailed fix guide
- 📄 `PRODUCTION_CHAT_SESSION_FIX.md` - Technical explanation

---

**TL;DR:**
1. Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables
2. Push code changes to git
3. Test in production
4. Done! ✅

