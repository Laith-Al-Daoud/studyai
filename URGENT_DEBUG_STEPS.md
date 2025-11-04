# 🔍 URGENT: Debug Steps for Chat Webhook Not Being Called

I've added extensive debug logging to help us figure out exactly what's happening.

## Step 1: Deploy Debug Version

```bash
cd /home/laith/code/reposo/studai
git add src/lib/actions/chat.ts DEBUG_CHAT_ISSUE.md URGENT_DEBUG_STEPS.md
git commit -m "Debug: Add extensive logging to chat webhook"
git push
```

Wait for Vercel to deploy (should auto-deploy on push).

## Step 2: Test and Collect Logs

### A. Check if Message is Created in Database

1. Go to **Supabase Dashboard** → **Table Editor** → `chats` table
2. In your production app, send a chat message
3. Refresh the Supabase table
4. **Does a new row appear?**
   - ✅ **YES** → Server action works, issue is with webhook call
   - ❌ **NO** → Server action itself is failing

### B. Check Vercel Server Logs

1. Go to **Vercel Dashboard** → Your Project → **Logs**
2. Filter to show only "Serverless Function" logs
3. Send a chat message in production
4. Look for lines with `[DEBUG]`

**Copy and paste ALL `[DEBUG]` lines you see here.**

Expected logs:
```
[DEBUG] About to call chat webhook: { url: "...", chatId: "...", fileCount: 0 }
[DEBUG] Auth tokens: { hasAccessToken: true/false, hasServiceRoleKey: true/false, ... }
[DEBUG] Calling webhook with auth token
[DEBUG] Webhook response status: 200
[DEBUG] Webhook called successfully
```

## Step 3: Quick Checks

### Check 1: Is the message showing in the UI?

After sending a message:
- **Do you see the message appear** (even without a response)?
- **Or does nothing happen at all?**

### Check 2: Browser Console

Open DevTools → Console, send a message:
- Any errors?
- Any network failures?

### Check 3: Network Tab

Open DevTools → Network tab, send a message:
- Do you see a POST request to your server action?
- What's the response status?

## Step 4: Environment Variables Double-Check

### In Vercel Dashboard → Settings → Environment Variables

You should have:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://xxxxx.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJ...`
- `SUPABASE_SERVICE_ROLE_KEY` = `eyJ...` ← Did you add this?

## Most Likely Scenarios

### Scenario A: Logs show "No authentication token available"
**Problem:** `SUPABASE_SERVICE_ROLE_KEY` not set in Vercel
**Fix:** Add it in Vercel environment variables, redeploy

### Scenario B: Logs show webhook called but status 401/403
**Problem:** Edge Function rejecting the request
**Fix:** Check Edge Function logs in Supabase Dashboard

### Scenario C: No logs at all
**Problem:** Server action not being called
**Fix:** Check browser console for client-side errors

### Scenario D: Message doesn't appear in database
**Problem:** Server action failing before webhook call
**Fix:** Check if there are any errors before the `[DEBUG]` logs

## What I Need From You

Please run these steps and tell me:

1. **Do messages appear in the `chats` table in Supabase?** (YES/NO)
2. **What do you see in Vercel logs?** (Copy all `[DEBUG]` lines)
3. **Any errors in browser console?** (Copy them)
4. **Did you add `SUPABASE_SERVICE_ROLE_KEY` to Vercel?** (YES/NO)

With this information, I can pinpoint the exact issue!

