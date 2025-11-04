# Production Chat Session Issue - Real Problem

## The Actual Issue

Your Edge Functions **ARE deployed** (file upload works).

The problem is: **Server actions in production Vercel can't retrieve the session token from cookies**.

### What's Happening

```typescript
// In createMessage() server action
const { data: { session } } = await supabase.auth.getSession();

if (session?.access_token) {
  fetch(edgeFunctionUrl, ...); // ✅ Executes locally
} else {
  console.warn('No session token available'); // ❌ Executes in production
}
```

In production:
- `session` is `null`
- Webhook is never called
- Chat hangs forever

## Why This Happens

Vercel serverless functions have different cookie handling than local dev:
- **Local:** Cookies are easily accessible
- **Vercel:** Serverless functions sometimes can't read cookies properly

## The Fix

We need to use `getUser()` instead of `getSession()` for authentication, then manually construct the auth header.

### Option 1: Use Service Role Key (Recommended)

The Edge Function should handle auth verification, not the server action:

```typescript
// In chat.ts
export async function createMessage(input: CreateMessageInput) {
  // ... existing code ...

  // Instead of using session token, use service role key
  const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat-webhook`;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceRoleKey) {
    fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`, // Use service role
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        chat_id: chatMessage.id,
        user_id: user.id,
        chapter_id: validated.chapter_id,
        message: validated.message,
        files: files || [],
        history: previousMessages || [],
      }),
    }).catch((err) => {
      console.error('Error calling chat webhook:', err);
    });
  }
}
```

### Option 2: Get Fresh Access Token

Force token refresh in production:

```typescript
// Force a fresh session
const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

if (sessionError) {
  console.error('Session refresh error:', sessionError);
}

const accessToken = session?.access_token;
```

## Implementation

I'll implement Option 1 (service role key) as it's more reliable.

