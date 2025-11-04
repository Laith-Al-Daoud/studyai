# Debug Chat Webhook Not Being Called

## Current Status

The chat webhook is still not being invoked in production, even with the service role key fallback.

## Debug Steps

I've added extensive logging to `src/lib/actions/chat.ts` to help diagnose the issue.

### Step 1: Deploy Debug Version

```bash
cd /home/laith/code/reposo/studai
git add src/lib/actions/chat.ts
git commit -m "Debug: Add logging to chat webhook call"
git push
```

### Step 2: Check Vercel Server Logs

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Logs** tab
4. Filter by "Serverless Function"
5. Send a chat message in your production app
6. Look for logs with `[DEBUG]` prefix

### What to Look For

#### Scenario A: No logs at all
**Meaning:** `createMessage` function isn't being called
**Possible causes:**
- Client-side error preventing the server action call
- Network issue
- CSP blocking the request

**Check:**
- Browser console for errors
- Network tab in DevTools

#### Scenario B: Logs show "No authentication token available"
**Meaning:** Both session token AND service role key are missing
**Check:**
```bash
# In Vercel Dashboard → Settings → Environment Variables
# Make sure you have:
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

#### Scenario C: Logs show "Calling webhook" but then "Webhook error response"
**Meaning:** Webhook is being called but failing
**Check:**
- The error response text in logs
- Edge Function logs in Supabase

#### Scenario D: Logs show success but chat doesn't update
**Meaning:** Different issue (Realtime subscription, database, etc.)

### Step 3: Check Edge Function Logs (Supabase)

```bash
# If you have Supabase CLI
npx supabase functions logs chat-webhook --project-ref YOUR_PROJECT_REF --follow

# Or go to Supabase Dashboard → Edge Functions → chat-webhook → Logs
```

### Step 4: Check Environment Variables

In production, verify these are set:

**Vercel (for Next.js):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` ← New requirement

**Supabase (for Edge Functions):**
- `N8N_CHAT_WEBHOOK_URL` (or will use mock response)
- `ALLOWED_ORIGINS` (your Vercel domain)

### Step 5: Test Message Creation

Check if messages are being created in the database at all:

1. Go to Supabase Dashboard → Table Editor → `chats` table
2. Send a message in production
3. Refresh the table
4. **If message appears:** Server action works, webhook call is the issue
5. **If no message:** Server action itself is failing

## Common Issues

### Issue 1: CORS in Vercel Edge Runtime

Vercel's Edge Runtime might block outgoing fetch calls differently than Node.js.

**Solution:** Switch to `await fetch` instead of fire-and-forget (already done in debug version)

### Issue 2: Environment Variables Not Available

Server actions in Vercel might not have access to environment variables in some configurations.

**Solution:** Add to `next.config.ts`:
```typescript
experimental: {
  serverActions: {
    allowedOrigins: ['your-domain.vercel.app'],
  },
},
```

### Issue 3: Middleware Blocking Server Actions

The security middleware might be interfering with server actions.

**Solution:** Check `middleware.ts` matcher config

### Issue 4: Supabase URL Wrong

If `NEXT_PUBLIC_SUPABASE_URL` is wrong in production, the webhook URL will be wrong.

**Solution:** Verify in Vercel env vars

## Next Steps After Reviewing Logs

Based on what you see in the logs, we can:
1. Fix environment variable issues
2. Fix CORS/fetch issues
3. Fix Edge Function issues
4. Fix Realtime subscription issues

Please run the steps above and share what you see in the Vercel logs when you send a message.

