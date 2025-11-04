# Chat Webhook Deployment Guide

**Last Updated:** October 30, 2025  
**Stage:** 4 - Chat Interface & LLM Integration

---

## 📋 Overview

This guide walks you through deploying the chat webhook Edge Function and configuring n8n for LLM integration.

---

## 🚀 Quick Deployment (Without n8n)

If you want to test the chat interface without setting up n8n first:

### Step 1: Deploy Edge Function

```bash
cd studai
supabase functions deploy chat-webhook
```

**Expected Output:**
```
✓ Deploying function...
✓ chat-webhook deployed successfully
```

### Step 2: Test the Chat

1. Navigate to any chapter in your app
2. Send a chat message
3. You'll receive a mock response

The mock response will include a note about configuring n8n for real LLM integration.

---

## 🤖 Full Deployment (With n8n)

For production use with real LLM responses:

### Prerequisites

- ✅ n8n instance (cloud or self-hosted)
- ✅ OpenAI/Anthropic/other LLM API key
- ✅ Supabase project with chat-webhook deployed

---

## Step 1: Create n8n Workflow

### 1.1 Create New Workflow

1. Log in to your n8n instance
2. Click "Create Workflow"
3. Name it: "StudAI Chat Processing"

### 1.2 Add Webhook Trigger

1. Click "Add Node"
2. Search for "Webhook"
3. Configure:
   - **Method:** POST
   - **Path:** `chat` (or any custom path)
   - **Authentication:** None (we'll add this later)
   - **Response Mode:** When Last Node Finishes

### 1.3 Add LLM Node

#### Option A: OpenAI

1. Add "OpenAI" node
2. Configure:
   - **Resource:** Chat
   - **Operation:** Message a Model
   - **Model:** gpt-3.5-turbo or gpt-4
   - **Message:** `{{ $json.message }}`
   
3. Add System Message:
   ```
   You are a helpful study assistant. The user has uploaded PDF files 
   containing lecture materials. Answer their questions based on the 
   context provided.
   
   Available files: {{ $json.files.length }}
   ```

4. Connect your OpenAI API credentials

#### Option B: Anthropic

1. Add "HTTP Request" node
2. Configure:
   - **Method:** POST
   - **URL:** `https://api.anthropic.com/v1/messages`
   - **Headers:**
     ```json
     {
       "x-api-key": "your-anthropic-key",
       "anthropic-version": "2023-06-01",
       "content-type": "application/json"
     }
     ```
   - **Body:**
     ```json
     {
       "model": "claude-3-sonnet-20240229",
       "max_tokens": 1024,
       "messages": [
         {
           "role": "user",
           "content": "{{ $json.message }}"
         }
       ],
       "system": "You are a helpful study assistant."
     }
     ```

### 1.4 Add Response Formatter

1. Add "Set" node or "Code" node
2. Name it: "Format Response"
3. Configure to transform LLM output to expected format:

**For OpenAI:**
```javascript
const response = $input.all()[0].json.choices[0].message.content;
const tokens = $input.all()[0].json.usage.total_tokens;
const model = $input.all()[0].json.model;

return [
  {
    json: {
      response: response,
      meta: {
        model: model,
        tokens: tokens,
        processed_at: new Date().toISOString()
      }
    }
  }
];
```

**For Anthropic:**
```javascript
const response = $input.all()[0].json.content[0].text;
const tokens = $input.all()[0].json.usage.output_tokens;

return [
  {
    json: {
      response: response,
      meta: {
        model: "claude-3-sonnet",
        tokens: tokens,
        processed_at: new Date().toISOString()
      }
    }
  }
];
```

### 1.5 Connect Nodes

Webhook → LLM Node → Format Response → Webhook Response

### 1.6 Activate Workflow

1. Click "Activate" toggle in top-right
2. Copy the webhook URL (e.g., `https://your-n8n.com/webhook/chat`)

---

## Step 2: Configure Supabase Secrets

### 2.1 Set n8n Webhook URL

```bash
supabase secrets set N8N_CHAT_WEBHOOK_URL=https://your-n8n.com/webhook/chat
```

### 2.2 Verify Secrets

```bash
supabase secrets list
```

**Expected Output:**
```
N8N_CHAT_WEBHOOK_URL: https://your-n8n.com/webhook/***
N8N_FILE_UPLOAD_WEBHOOK_URL: https://your-n8n.com/webhook/*** (if set)
```

---

## Step 3: Test End-to-End

### 3.1 Send Test Message

1. Open your StudAI app
2. Navigate to any chapter
3. Send a message: "What is this chapter about?"

### 3.2 Verify Workflow

1. Go to n8n executions page
2. You should see a new execution
3. Check each node for successful execution

### 3.3 Verify Response

1. In StudAI, wait 2-10 seconds
2. You should see a real LLM response
3. Check that it's NOT the mock response

---

## 🔧 Advanced Configuration

### Adding File Context to LLM

To make the LLM aware of uploaded files:

**In n8n System Prompt:**
```
You are a helpful study assistant. The user has uploaded the following files:

{{#each $json.files}}
- {{ this.file_name }} (URL: {{ this.file_url }})
{{/each}}

Note: These are signed URLs that expire in 7 days.

Answer the user's question: {{ $json.message }}
```

**Note:** For true RAG (Retrieval-Augmented Generation), you'd need to:
1. Extract text from PDFs
2. Create embeddings
3. Store in vector database
4. Query relevant chunks
5. Include in LLM context

This is beyond the current scope but can be added as an enhancement.

### Adding Authentication

For production, secure the n8n webhook:

**Option 1: API Key Header**

1. In n8n Webhook node:
   - Enable "Header Auth"
   - Set header name: `X-API-Key`
   - Set expected value: Generate a random key

2. In Supabase Edge Function:
   ```typescript
   const n8nApiKey = Deno.env.get('N8N_API_KEY');
   
   const n8nResponse = await fetch(n8nWebhookUrl, {
     headers: {
       'X-API-Key': n8nApiKey,
       'Content-Type': 'application/json',
     },
     // ...
   });
   ```

3. Set the secret:
   ```bash
   supabase secrets set N8N_API_KEY=your-random-api-key
   ```

**Option 2: HMAC Signature**

More secure but complex - signs the payload with a shared secret.

---

## 📊 Monitoring & Logging

### Supabase Edge Function Logs

```bash
supabase functions logs chat-webhook
```

Or in the Supabase Dashboard:
1. Go to Edge Functions
2. Click on "chat-webhook"
3. View logs tab

### n8n Execution Logs

1. Go to n8n Executions page
2. Click on any execution
3. View node-by-node results
4. Check for errors

### Database Verification

Check that responses are being saved:

```sql
SELECT 
  id,
  message,
  response IS NOT NULL as has_response,
  meta,
  created_at
FROM chats
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Issue: Mock responses still appearing

**Cause:** N8N_CHAT_WEBHOOK_URL not set or incorrect

**Solution:**
```bash
# Check current secrets
supabase secrets list

# Set the correct URL
supabase secrets set N8N_CHAT_WEBHOOK_URL=https://your-n8n.com/webhook/chat

# Redeploy the function
supabase functions deploy chat-webhook
```

---

### Issue: n8n webhook returns 404

**Cause:** Workflow not activated or wrong URL

**Solution:**
1. Check workflow is active (toggle in top-right)
2. Verify webhook URL is correct
3. Test webhook directly:
   ```bash
   curl -X POST https://your-n8n.com/webhook/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "test", "files": []}'
   ```

---

### Issue: LLM API errors

**Cause:** Invalid API key or rate limits

**Solution:**
1. Check API key is valid
2. Check API credit balance
3. Review rate limits
4. Check n8n execution logs for error details

---

### Issue: Responses not updating in UI

**Cause:** Realtime subscription not working

**Solution:**
1. Check Realtime is enabled in Supabase Dashboard
2. Check browser console for WebSocket errors
3. Verify RLS policies allow SELECT on chats table
4. Try refreshing the page

---

## 🔐 Security Best Practices

### 1. Secure Webhook URLs

- ✅ Use HTTPS only
- ✅ Add authentication (API key or HMAC)
- ✅ Validate webhook payloads
- ✅ Rate limit webhook calls

### 2. Protect API Keys

- ✅ Store in environment variables
- ✅ Never commit to git
- ✅ Use Supabase secrets for Edge Functions
- ✅ Rotate keys periodically

### 3. Validate Inputs

- ✅ Sanitize user messages
- ✅ Limit message length
- ✅ Validate file URLs
- ✅ Check user permissions

### 4. Monitor Usage

- ✅ Track LLM API usage
- ✅ Monitor costs
- ✅ Set up alerts for errors
- ✅ Review logs regularly

---

## 💰 Cost Considerations

### LLM API Costs (Estimates)

**OpenAI GPT-3.5-turbo:**
- ~$0.002 per 1K tokens (input + output)
- Average chat: 200-500 tokens
- Cost per message: ~$0.0004 - $0.001

**OpenAI GPT-4:**
- ~$0.03 per 1K tokens (input)
- ~$0.06 per 1K tokens (output)
- Average chat: 200-500 tokens
- Cost per message: ~$0.006 - $0.015

**Anthropic Claude:**
- Similar pricing to GPT-4
- Check current rates at anthropic.com

### Supabase Costs

- Edge Function invocations: Free tier includes 500K/month
- Database operations: Included in free tier
- Realtime connections: Free tier includes 200 concurrent

### n8n Costs

- Self-hosted: Free (infrastructure costs only)
- Cloud: Starts at $20/month

---

## 📈 Optimization Tips

### 1. Reduce LLM Costs

- Use GPT-3.5-turbo for simple queries
- Implement caching for common questions
- Limit context window size
- Set max_tokens appropriately

### 2. Improve Response Time

- Use faster models (GPT-3.5-turbo)
- Implement streaming responses
- Cache LLM responses
- Optimize n8n workflow

### 3. Scale for Production

- Monitor usage patterns
- Implement rate limiting
- Add request queuing
- Consider dedicated LLM endpoint

---

## ✅ Deployment Checklist

Before going to production:

- [ ] n8n workflow created and tested
- [ ] LLM API credentials configured
- [ ] N8N_CHAT_WEBHOOK_URL secret set
- [ ] Edge Function deployed
- [ ] End-to-end testing completed
- [ ] Webhook authentication added
- [ ] Monitoring and logging configured
- [ ] Cost alerts set up
- [ ] Rate limiting implemented
- [ ] Error handling tested
- [ ] Documentation updated

---

## 📞 Support

**Common Issues:**
- Check Edge Function logs first
- Verify n8n execution logs
- Test webhook directly with curl
- Review database for response updates

**Resources:**
- n8n Documentation: https://docs.n8n.io
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- OpenAI API: https://platform.openai.com/docs
- Anthropic API: https://docs.anthropic.com

---

**Guide Version:** 1.0  
**Last Updated:** October 30, 2025  
**Stage:** 4 - Chat Interface & LLM Integration

