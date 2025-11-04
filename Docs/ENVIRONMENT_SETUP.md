# Environment Variables Setup Guide

**Last Updated:** October 30, 2025

---

## 📋 Overview

This guide explains all environment variables needed for StudAI and how to configure them.

---

## 🔑 Required Variables

### Supabase Configuration

These are **required** for the app to function:

```bash
# Supabase URL (public, safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anonymous Key (public, safe to expose)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (private, server-side only!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find these:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the values

**Security Note:**
- ⚠️ **Never** expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- ⚠️ **Never** commit `.env.local` to git
- ✅ Only `NEXT_PUBLIC_*` variables are sent to the browser

---

## 🤖 Optional Variables (n8n Integration)

### Chat Webhook

For Stage 4 LLM integration:

```bash
N8N_CHAT_WEBHOOK_URL=https://your-n8n.com/webhook/chat
```

**When to set:**
- After creating n8n workflow for chat
- When you want real LLM responses instead of mock responses

**What happens if not set:**
- Chat will use mock responses
- You'll see a note in the response about configuring n8n
- Everything else works normally

### File Upload Webhook

For Stage 3 file processing:

```bash
N8N_FILE_UPLOAD_WEBHOOK_URL=https://your-n8n.com/webhook/file-upload
```

**When to set:**
- After creating n8n workflow for file processing
- When you want to process PDFs (extract text, create embeddings, etc.)

**What happens if not set:**
- Files still upload and store successfully
- No webhook notification sent
- No automatic processing

### n8n Authentication

If your n8n webhooks require authentication:

```bash
N8N_API_KEY=your-secret-api-key
```

**When to set:**
- When you've enabled authentication on n8n webhooks
- For production security

---

## 🛠️ Setup Instructions

### Development Setup

1. **Create `.env.local` file:**
   ```bash
   cd studai
   touch .env.local
   ```

2. **Add required variables:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Verify setup:**
   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` - you should see the app running.

### Edge Functions Setup

Edge Functions read from Supabase Secrets, not `.env.local`.

1. **Set required secrets:**
   ```bash
   supabase secrets set SUPABASE_URL=https://your-project.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Set optional secrets (if using n8n):**
   ```bash
   supabase secrets set N8N_CHAT_WEBHOOK_URL=https://your-n8n.com/webhook/chat
   supabase secrets set N8N_FILE_UPLOAD_WEBHOOK_URL=https://your-n8n.com/webhook/file-upload
   ```

3. **Verify secrets:**
   ```bash
   supabase secrets list
   ```

   You should see all your secrets (values are masked).

### Production Setup (Vercel)

1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - (Optional) `N8N_CHAT_WEBHOOK_URL`
   - (Optional) `N8N_FILE_UPLOAD_WEBHOOK_URL`

5. **Redeploy:**
   ```bash
   git push
   ```
   Or trigger manual deploy in Vercel dashboard.

---

## 📚 Variable Reference

### Complete List

| Variable | Type | Required | Where Used | Description |
|----------|------|----------|------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | ✅ Yes | Client & Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | ✅ Yes | Client & Server | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Private | ✅ Yes | Server & Edge Functions | Full access key (bypasses RLS) |
| `N8N_CHAT_WEBHOOK_URL` | Private | ❌ No | Edge Functions | Chat webhook endpoint |
| `N8N_FILE_UPLOAD_WEBHOOK_URL` | Private | ❌ No | Edge Functions | File upload webhook endpoint |
| `N8N_API_KEY` | Private | ❌ No | Edge Functions | n8n authentication |

### Variable Types

**Public Variables** (`NEXT_PUBLIC_*`)
- ✅ Safe to expose in browser
- ✅ Included in client-side bundle
- ✅ Available in components
- ⚠️ Anyone can see these in browser dev tools

**Private Variables** (no prefix)
- ❌ Never sent to browser
- ✅ Only available server-side
- ✅ Used in API routes, server actions, Edge Functions
- ⚠️ Keep these secret!

---

## 🔒 Security Best Practices

### 1. Never Commit Secrets

Add to `.gitignore`:
```
.env.local
.env*.local
.env.production
```

Verify:
```bash
git status
```

If `.env.local` appears, it's NOT ignored - fix your `.gitignore`!

### 2. Use Different Keys for Dev/Prod

- Development: Use a separate Supabase project
- Production: Use production Supabase project
- Never mix credentials

### 3. Rotate Keys Regularly

**When to rotate:**
- Suspected key exposure
- Employee departure
- Every 90 days (best practice)

**How to rotate:**
1. Generate new keys in Supabase Dashboard
2. Update environment variables
3. Redeploy applications
4. Revoke old keys

### 4. Limit Service Role Key Usage

Only use service role key when you need to:
- Bypass RLS (for admin operations)
- Access from Edge Functions
- Perform background tasks

For normal operations, use anon key with RLS.

---

## 🧪 Testing Configuration

### Verify Environment Variables

Create `studai/src/app/api/test-env/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    n8nChatWebhook: !!process.env.N8N_CHAT_WEBHOOK_URL,
    n8nFileWebhook: !!process.env.N8N_FILE_UPLOAD_WEBHOOK_URL,
  });
}
```

Navigate to: `http://localhost:3000/api/test-env`

Expected response:
```json
{
  "supabaseUrl": true,
  "anonKey": true,
  "serviceRoleKey": true,
  "n8nChatWebhook": false,  // true if set
  "n8nFileWebhook": false   // true if set
}
```

**Important:** Remove this endpoint before deploying to production!

---

## 🐛 Troubleshooting

### Issue: "Invalid Supabase URL"

**Cause:** Missing or incorrect `NEXT_PUBLIC_SUPABASE_URL`

**Solution:**
1. Check `.env.local` exists
2. Verify URL format: `https://xxxxx.supabase.co`
3. No trailing slash
4. Restart dev server: `npm run dev`

---

### Issue: "Failed to fetch"

**Cause:** Incorrect Supabase URL or key

**Solution:**
1. Verify keys in Supabase Dashboard
2. Check for typos (keys are long!)
3. Ensure no extra spaces
4. Try regenerating keys

---

### Issue: "Unauthorized" errors

**Cause:** Using anon key where service role is needed

**Solution:**
1. Check if RLS is blocking the operation
2. Use service role key for admin operations
3. Review RLS policies

---

### Issue: Edge Function secrets not working

**Cause:** Secrets not set or not deployed

**Solution:**
1. Set secrets: `supabase secrets set KEY=value`
2. List secrets: `supabase secrets list`
3. Redeploy: `supabase functions deploy`

---

### Issue: Changes not taking effect

**Cause:** Environment variables cached

**Solution:**
1. Restart dev server
2. Clear Next.js cache: `rm -rf .next`
3. Rebuild: `npm run build`
4. For Vercel: Redeploy

---

## 📝 Environment Files

### Development

**File:** `.env.local` (gitignored)

**Contains:**
- All `NEXT_PUBLIC_*` variables
- All private variables for local development

**Used by:** Next.js dev server

### Production (Vercel)

**Location:** Vercel Dashboard → Settings → Environment Variables

**Contains:**
- All `NEXT_PUBLIC_*` variables
- All private variables for production

**Used by:** Vercel build & runtime

### Edge Functions

**Location:** Supabase Secrets (set via CLI or Dashboard)

**Contains:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_CHAT_WEBHOOK_URL` (optional)
- `N8N_FILE_UPLOAD_WEBHOOK_URL` (optional)
- `N8N_API_KEY` (optional)

**Used by:** Supabase Edge Functions

---

## ✅ Setup Checklist

### Initial Setup

- [ ] Created `.env.local` file
- [ ] Added `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Added `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Added `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Verified `.env.local` is in `.gitignore`
- [ ] Tested app runs: `npm run dev`

### Edge Functions

- [ ] Set `SUPABASE_URL` secret
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` secret
- [ ] (Optional) Set `N8N_CHAT_WEBHOOK_URL`
- [ ] (Optional) Set `N8N_FILE_UPLOAD_WEBHOOK_URL`
- [ ] Deployed Edge Functions
- [ ] Tested Edge Functions work

### Production

- [ ] Set all variables in Vercel
- [ ] Different keys for dev/prod
- [ ] Tested production deployment
- [ ] Removed test endpoints

---

## 🔗 Related Documentation

- [Supabase Environment Variables](https://supabase.com/docs/guides/cli/managing-environments)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Guide Version:** 1.0  
**Last Updated:** October 30, 2025  
**Stages Covered:** 1-4

