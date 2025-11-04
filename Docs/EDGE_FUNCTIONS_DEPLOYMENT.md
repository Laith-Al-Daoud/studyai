# Supabase Edge Functions Deployment Guide

**Version:** 1.0  
**Date:** October 30, 2025

---

## Overview

This guide covers deploying and configuring Supabase Edge Functions for the StudAI application.

---

## Prerequisites

1. **Supabase CLI installed:**
   ```bash
   npm install -g supabase
   ```

2. **Supabase project created:**
   - Visit [supabase.com/dashboard](https://supabase.com/dashboard)
   - Create a new project or use existing one

3. **Supabase CLI authenticated:**
   ```bash
   supabase login
   ```

4. **Project linked:**
   ```bash
   cd studai
   supabase link --project-ref YOUR_PROJECT_REF
   ```

---

## Edge Functions Overview

### 1. file-upload-webhook

**Purpose:** Forwards file upload metadata to n8n for processing

**Trigger:** Called by `uploadFile()` server action after successful upload

**Payload:**
```json
{
  "user_id": "uuid",
  "subject_id": "uuid", 
  "chapter_id": "uuid",
  "file_url": "storage_path",
  "file_name": "lecture.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook triggered successfully"
}
```

### 2. chat-webhook

**Purpose:** Handles chat message processing (Stage 4)

**Status:** Placeholder for Stage 4 implementation

---

## Deployment Steps

### Step 1: Deploy Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individual functions
supabase functions deploy file-upload-webhook
supabase functions deploy chat-webhook
```

### Step 2: Configure Secrets

```bash
# Set n8n webhook URL (optional - only if n8n is configured)
supabase secrets set N8N_FILE_UPLOAD_WEBHOOK_URL=https://your-n8n-instance.com/webhook/file-upload

# Note: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically provided
```

### Step 3: Verify Deployment

```bash
# List deployed functions
supabase functions list

# Get function details
supabase functions get file-upload-webhook

# View function logs
supabase functions logs file-upload-webhook
```

### Step 4: Test Functions

#### Test file-upload-webhook:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/file-upload-webhook \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-id",
    "subject_id": "test-subject-id",
    "chapter_id": "test-chapter-id",
    "file_url": "test-file-path.pdf",
    "file_name": "test.pdf"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Webhook not configured"
}
```

Or if n8n is configured:
```json
{
  "success": true,
  "message": "Webhook triggered successfully",
  "data": { /* n8n response */ }
}
```

---

## Environment Variables

### Required (Auto-provided)

These are automatically available in Edge Functions:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

### Optional (User-configured)

Configure via `supabase secrets set`:

- `N8N_FILE_UPLOAD_WEBHOOK_URL` - n8n webhook endpoint for file processing
- `N8N_CHAT_WEBHOOK_URL` - n8n webhook endpoint for chat (Stage 4)
- `N8N_API_KEY` - API key for authenticating with n8n (if needed)

---

## n8n Webhook Configuration

### Setup n8n File Upload Webhook

1. **Create Workflow in n8n:**
   - Add Webhook node (trigger)
   - Set method to POST
   - Copy webhook URL

2. **Configure Payload Handling:**
   ```javascript
   // Expected payload from Edge Function:
   {
     event: "file_upload",
     timestamp: "2025-10-30T...",
     user_id: "uuid",
     subject_id: "uuid",
     chapter_id: "uuid",
     file_name: "lecture.pdf",
     file_url: "https://...signed_url"  // 7-day signed URL
   }
   ```

3. **Add Processing Nodes:**
   - HTTP Request node to download PDF from signed URL
   - PDF parsing node (if available)
   - Text extraction node
   - Vector embedding node (optional)
   - Storage/database node to save results

4. **Add Response Node:**
   ```json
   {
     "success": true,
     "message": "File processed successfully"
   }
   ```

5. **Set Webhook URL:**
   ```bash
   supabase secrets set N8N_FILE_UPLOAD_WEBHOOK_URL=https://n8n.example.com/webhook/abc123
   ```

---

## Monitoring & Debugging

### View Function Logs

```bash
# Live logs
supabase functions logs file-upload-webhook --follow

# Recent logs (last 100 lines)
supabase functions logs file-upload-webhook --tail 100

# Filter by time
supabase functions logs file-upload-webhook --since 1h
```

### Common Issues

#### 1. Function Timeout

**Symptom:** Function takes > 60 seconds

**Solution:**
- Edge Functions have 60s timeout
- For long-running tasks, use async patterns
- Return immediately and process in background

#### 2. CORS Errors

**Symptom:** Browser shows CORS error

**Solution:**
- Ensure `corsHeaders` are included in all responses
- Check `OPTIONS` preflight handling

#### 3. Authentication Errors

**Symptom:** 401 Unauthorized

**Solution:**
- Verify `Authorization: Bearer ANON_KEY` header is sent
- Check function is deployed and accessible

#### 4. n8n Connection Failed

**Symptom:** Webhook call to n8n fails

**Solution:**
- Verify n8n URL is correct
- Check n8n is accessible from Supabase (not localhost)
- Verify webhook is active in n8n

---

## Local Development

### Run Functions Locally

```bash
# Start Supabase local development
supabase start

# Serve functions locally
supabase functions serve file-upload-webhook

# Test locally
curl -X POST http://localhost:54321/functions/v1/file-upload-webhook \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

### Set Local Secrets

```bash
# Create .env file in function directory
echo "N8N_FILE_UPLOAD_WEBHOOK_URL=http://localhost:5678/webhook/test" > supabase/functions/file-upload-webhook/.env
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Edge Functions deployed
- [ ] Secrets configured (n8n URLs)
- [ ] Functions tested with curl
- [ ] n8n workflows created and active
- [ ] Logs verified (no errors)
- [ ] CORS headers working
- [ ] Authentication working
- [ ] Webhook integration tested end-to-end

---

## Rollback Procedure

If you need to rollback a function:

```bash
# List function versions
supabase functions list --include-all-versions

# Deploy specific version
supabase functions deploy file-upload-webhook --version-id VERSION_ID
```

---

## Security Best Practices

1. **Never expose service role key in frontend**
   - Only use in Edge Functions
   - Auto-provided by Supabase

2. **Validate webhook signatures**
   - Add signature verification if needed
   - Use shared secrets between services

3. **Rate limiting**
   - Implement rate limiting in functions if needed
   - Monitor for abuse

4. **Input validation**
   - Always validate incoming payload
   - Sanitize user inputs

5. **Error handling**
   - Don't leak sensitive info in error messages
   - Log errors server-side only

---

## Cost Considerations

**Supabase Edge Functions Pricing:**

- **Free Tier:** 500,000 invocations/month
- **Pro Tier:** 2,000,000 invocations/month included
- **Additional:** $2 per 1M invocations

**Tips to optimize:**
- Only call webhooks when needed
- Use async/background processing for non-critical operations
- Cache results where possible
- Monitor usage in Supabase dashboard

---

## Next Steps

1. **Stage 3:** File upload webhook is ready
2. **Stage 4:** Implement chat webhook
3. **Future:** Add more Edge Functions as needed

---

## Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Runtime Docs](https://deno.land/manual)
- [n8n Webhook Docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

---

**Last Updated:** October 30, 2025  
**Maintained By:** Development Team


