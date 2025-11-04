# n8n Webhook Setup Guide

This document provides detailed instructions for setting up n8n workflows to integrate LLM capabilities with StudAI.

## Overview

StudAI uses n8n as the orchestration layer for LLM interactions. The application sends webhook requests to n8n, which processes them and returns AI-generated responses.

## Prerequisites

- n8n instance (self-hosted or cloud)
- LLM API access (OpenAI, Anthropic, or other supported providers)
- Basic understanding of n8n workflow creation

## Architecture

```
StudAI App → Edge Function → n8n Webhook → LLM API → Response → Edge Function → Database
```

## Workflow 1: File Upload Processing

This workflow is triggered when a user uploads a PDF file.

### Purpose
- Process newly uploaded PDF files
- Extract text content (optional for MVP)
- Create embeddings for semantic search (post-MVP)
- Log file processing status

### Workflow Structure

```
[Webhook Trigger]
    ↓
[Authenticate Request] (verify API key)
    ↓
[HTTP Response] (acknowledge receipt)
    ↓
[Process File] (extract metadata)
    ↓
[Store/Log Result]
```

### Setup Steps

1. **Create New Workflow:**
   - In n8n, click "Create Workflow"
   - Name it "StudAI - File Upload Handler"

2. **Add Webhook Node:**
   - Add "Webhook" node as trigger
   - Set HTTP Method: POST
   - Set Authentication: Header Auth
   - Header Name: `X-API-Key`
   - Copy the webhook URL

3. **Add Authentication Check:**
   - Add "IF" node
   - Condition: `{{ $json.headers['x-api-key'] }} === {{ $env.STUDAI_API_KEY }}`
   - If false, return 401 error

4. **Add Response Node:**
   - Add "Respond to Webhook" node
   - Status Code: 200
   - Body: `{ "status": "received", "file_id": "{{ $json.body.file_id }}" }`

5. **Process File (Optional for MVP):**
   - Add HTTP Request node to fetch file from Supabase
   - Add PDF parsing node if available
   - Store results as needed

6. **Save and Activate:**
   - Click "Save"
   - Toggle "Active" to enable the workflow

### Expected Payload

```json
{
  "user_id": "uuid",
  "subject_id": "uuid",
  "chapter_id": "uuid",
  "file_id": "uuid",
  "file_name": "lecture.pdf",
  "file_url": "https://your-project.supabase.co/storage/v1/object/...",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### Environment Variables

Set in n8n settings:
- `STUDAI_API_KEY` - Matches `N8N_API_KEY` in StudAI `.env.local`
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - For authenticated requests

---

## Workflow 2: Chat Message Processing

This workflow handles user chat messages and generates AI responses.

### Purpose
- Receive user chat messages
- Query LLM with context from uploaded files
- Return formatted AI response
- Track token usage and metadata

### Workflow Structure

```
[Webhook Trigger]
    ↓
[Authenticate Request]
    ↓
[Fetch Chapter Files] (from Supabase)
    ↓
[Build Context] (combine files + message)
    ↓
[LLM Query] (OpenAI/Anthropic/etc.)
    ↓
[Format Response]
    ↓
[HTTP Response]
```

### Setup Steps

1. **Create New Workflow:**
   - Name it "StudAI - Chat Handler"

2. **Add Webhook Node:**
   - Add "Webhook" node
   - HTTP Method: POST
   - Authentication: Header Auth
   - Copy webhook URL

3. **Add Authentication:**
   - Add "IF" node for API key validation
   - Same as File Upload workflow

4. **Fetch Chapter Context:**
   - Add "HTTP Request" node
   - Method: GET
   - URL: `{{ $env.SUPABASE_URL }}/rest/v1/files?chapter_id=eq.{{ $json.body.chapter_id }}`
   - Headers:
     - `apikey`: `{{ $env.SUPABASE_SERVICE_KEY }}`
     - `Authorization`: `Bearer {{ $env.SUPABASE_SERVICE_KEY }}`

5. **Build LLM Context:**
   - Add "Code" node (JavaScript)
   - Combine user message with file information:

```javascript
const userMessage = $input.item.json.body.message;
const files = $input.first().json;

const context = files.map(f => `File: ${f.file_name}`).join('\n');

const systemPrompt = `You are a helpful study assistant. The user has uploaded these files: ${context}`;

return {
  json: {
    system: systemPrompt,
    user_message: userMessage
  }
};
```

6. **Add LLM Node:**
   - For OpenAI:
     - Add "OpenAI Chat" node
     - Model: gpt-4 or gpt-3.5-turbo
     - System Message: `{{ $json.system }}`
     - User Message: `{{ $json.user_message }}`
   
   - For Anthropic:
     - Add "HTTP Request" node
     - URL: `https://api.anthropic.com/v1/messages`
     - Method: POST
     - Headers:
       - `x-api-key`: Your Anthropic API key
       - `anthropic-version`: `2023-06-01`
       - `content-type`: `application/json`
     - Body:
```json
{
  "model": "claude-3-sonnet-20240229",
  "max_tokens": 1024,
  "system": "{{ $json.system }}",
  "messages": [
    {
      "role": "user",
      "content": "{{ $json.user_message }}"
    }
  ]
}
```

7. **Format Response:**
   - Add "Code" node to format the LLM response:

```javascript
const llmResponse = $input.first().json;

// For OpenAI
const response = llmResponse.choices[0].message.content;

// For Anthropic
// const response = llmResponse.content[0].text;

return {
  json: {
    response: response,
    meta: {
      model: llmResponse.model,
      tokens: llmResponse.usage?.total_tokens || 0,
      timestamp: new Date().toISOString()
    }
  }
};
```

8. **Return Response:**
   - Add "Respond to Webhook" node
   - Status Code: 200
   - Body: `{{ $json }}`

9. **Save and Activate**

### Expected Payload

```json
{
  "chat_id": "uuid",
  "user_id": "uuid",
  "chapter_id": "uuid",
  "message": "Explain the main concepts from lecture 1",
  "files": [
    {
      "file_id": "uuid",
      "file_name": "lecture-1.pdf",
      "file_url": "https://..."
    }
  ],
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### Response Format

```json
{
  "response": "The main concepts from lecture 1 include...",
  "meta": {
    "model": "gpt-4",
    "tokens": 256,
    "timestamp": "2025-01-01T00:00:05Z"
  }
}
```

---

## Security Configuration

### API Key Authentication

1. **Generate a secure API key:**
   ```bash
   openssl rand -hex 32
   ```

2. **Set in StudAI `.env.local`:**
   ```
   N8N_API_KEY=your-generated-key-here
   ```

3. **Set in n8n environment variables:**
   ```
   STUDAI_API_KEY=your-generated-key-here
   ```

### Webhook URL Configuration

After creating workflows, add URLs to `.env.local`:

```
N8N_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/
N8N_FILE_UPLOAD_WEBHOOK=https://your-n8n-instance.app.n8n.cloud/webhook/studai-file-upload
N8N_CHAT_WEBHOOK=https://your-n8n-instance.app.n8n.cloud/webhook/studai-chat
```

---

## Testing

### Test File Upload Webhook

```bash
curl -X POST https://your-n8n-instance/webhook/studai-file-upload \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "user_id": "test-user-id",
    "chapter_id": "test-chapter-id",
    "file_name": "test.pdf",
    "file_url": "https://example.com/test.pdf"
  }'
```

Expected Response:
```json
{
  "status": "received",
  "file_id": "test-file-id"
}
```

### Test Chat Webhook

```bash
curl -X POST https://your-n8n-instance/webhook/studai-chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "chat_id": "test-chat-id",
    "chapter_id": "test-chapter-id",
    "message": "What are the main topics?",
    "files": []
  }'
```

Expected Response:
```json
{
  "response": "Based on the context...",
  "meta": {
    "model": "gpt-4",
    "tokens": 150,
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

---

## Troubleshooting

### Common Issues

1. **401 Unauthorized:**
   - Verify API key matches in both StudAI and n8n
   - Check header name is `X-API-Key` (case-sensitive)

2. **Timeout Errors:**
   - Increase timeout in Edge Function (default 30s)
   - Optimize LLM prompt length
   - Use faster LLM models for testing

3. **Empty Responses:**
   - Check n8n workflow execution logs
   - Verify LLM API credentials
   - Ensure correct response formatting

4. **CORS Errors:**
   - n8n webhooks should allow cross-origin requests by default
   - Check n8n instance settings if issues persist

### Debug Mode

Enable debug logging in n8n:
1. Go to workflow settings
2. Enable "Save Execution Data"
3. Check execution logs for each node

---

## Advanced Features (Post-MVP)

### Vector Search Integration

- Add Pinecone/Weaviate node to n8n
- Create embeddings from PDF content
- Implement semantic search before LLM query

### Streaming Responses

- Use Server-Sent Events (SSE) for real-time responses
- Implement in Edge Function and n8n

### Rate Limiting

- Add rate limiting node in n8n
- Track usage per user
- Implement quota management

---

## Resources

- [n8n Documentation](https://docs.n8n.io)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Anthropic API Reference](https://docs.anthropic.com/claude/reference)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Last Updated:** October 29, 2025  
**Status:** Stage 1 Complete - Ready for Stage 2 Implementation

