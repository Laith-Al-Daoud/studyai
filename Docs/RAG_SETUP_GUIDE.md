# RAG Implementation Guide - StudAI

**Last Updated:** October 30, 2025  
**Purpose:** Full Retrieval-Augmented Generation setup

---

## 📋 Overview

This guide implements RAG (Retrieval-Augmented Generation) for StudAI, allowing the AI to answer questions based on actual PDF content using semantic search.

---

## 🔧 Architecture

```
PDF Upload → Extract Text → Chunk → Embed → Store
                                              ↓
User Question → Embed Question → Search Similar Chunks → Send to LLM → Response
```

---

## Part 1: PDF Processing Workflow (n8n)

### Workflow: "StudAI PDF Processor"

**Total Nodes:** ~10 nodes

#### Node 1: Webhook (Trigger)
```
Type: Webhook
Method: POST
Path: pdf-process
Authentication: None
Response Mode: When Last Node Finishes
```

**Expected Input:**
```json
{
  "file_id": "uuid",
  "file_url": "storage-url",
  "file_name": "chapter1.pdf",
  "chapter_id": "uuid",
  "user_id": "uuid"
}
```

---

#### Node 2: HTTP Request (Get Signed URL)
```javascript
// Code node to generate signed URL for the PDF
const fileUrl = $json.body.file_url;
const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseKey = "YOUR_SUPABASE_ANON_KEY";

// Request signed URL from Supabase Storage
const response = await fetch(
  `${supabaseUrl}/storage/v1/object/sign/pdfs/${fileUrl}?expiresIn=3600`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
const signedUrl = `${supabaseUrl}/storage/v1${data.signedURL}`;

return [{
  json: {
    ...($json.body || $json),
    signedUrl: signedUrl
  }
}];
```

---

#### Node 3: HTTP Request (Download PDF)
```
Method: GET
URL: {{ $json.signedUrl }}
Response Format: File
```

---

#### Node 4: Extract Text from PDF (n8n Built-in Node)

**Using n8n's Built-in "Extract from File" Node:**
```
Type: Extract from File
Operation: Extract Text from PDF
Binary Property: data
Output Property Name: extractedText
```

**That's it!** n8n handles PDF text extraction automatically.

**Alternative Options (for advanced use cases):**
- **pdf.co API** - Better for complex PDFs with tables
- **Google Document AI** - Best for scanned documents (OCR)
- **AWS Textract** - Enterprise-grade extraction

---

#### Node 5: Code (Clean and Prepare Text)
```javascript
// Get extracted text from the Extract from File node
const extractedText = $input.first().json.extractedText || '';

// Get webhook data
const webhookData = $('Webhook').first().json.body;

// Clean the text
let cleanText = extractedText
  .replace(/\s+/g, ' ')  // Normalize whitespace
  .replace(/\n{3,}/g, '\n\n')  // Remove excessive newlines
  .trim();

return [{
  json: {
    file_id: webhookData.file_id,
    chapter_id: webhookData.chapter_id,
    file_name: webhookData.file_name,
    fullText: cleanText,
    textLength: cleanText.length
  }
}];
```

---

#### Node 6: Code (Split into Chunks)
```javascript
// Configuration
const chunkSize = 800;  // Characters per chunk
const overlap = 100;    // Overlap between chunks

const text = $json.fullText || '';
const chunks = [];
let start = 0;
let index = 0;

// Split text into overlapping chunks
while (start < text.length) {
  const end = Math.min(start + chunkSize, text.length);
  const chunk = text.substring(start, end);
  
  // Skip very short chunks at the end
  if (chunk.length > 100) {
    chunks.push({
      file_id: $json.file_id,
      chapter_id: $json.chapter_id,
      chunk_text: chunk,
      chunk_index: index,
      metadata: {
        file_name: $json.file_name,
        total_length: text.length,
        chunk_size: chunkSize
      }
    });
    index++;
  }
  
  start += (chunkSize - overlap);
}

// Return each chunk as a separate item for processing
return chunks.map(chunk => ({ json: chunk }));
```

---

#### Node 7: OpenAI Embeddings (Create Vector Embeddings)
```
Node: OpenAI
Resource: Embeddings
Operation: Create Embedding
Model: text-embedding-3-small (1536 dimensions)
Text: {{ $json.chunk_text }}
```

**Settings:**
- Split in Batches: Yes (if many chunks)
- Batch Size: 10

---

#### Node 8: Code (Format for Database)
```javascript
// Get the embedding from OpenAI response
const embeddingData = $input.first().json;
const embedding = embeddingData.data?.[0]?.embedding || embeddingData.embedding;

// Format for Supabase
return [{
  json: {
    file_id: $json.file_id,
    chapter_id: $json.chapter_id,
    chunk_text: $json.chunk_text,
    chunk_index: $json.chunk_index,
    embedding: JSON.stringify(embedding),  // Convert array to JSON string
    metadata: $json.metadata
  }
}];
```

---

#### Node 9: Supabase (Insert into Database)
```
Node: Postgres or HTTP Request
Method: POST
URL: {{ $env.SUPABASE_URL }}/rest/v1/pdf_chunks
Headers:
  apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Content-Type: application/json
  Prefer: return=minimal

Body:
{
  "file_id": "{{ $json.file_id }}",
  "chapter_id": "{{ $json.chapter_id }}",
  "chunk_text": "{{ $json.chunk_text }}",
  "chunk_index": {{ $json.chunk_index }},
  "embedding": "{{ $json.embedding }}",
  "metadata": {{ JSON.stringify($json.metadata) }}
}
```

---

#### Node 10: Code (Update File Status)
```javascript
// After all chunks are processed, update file status
const fileId = $('Webhook').first().json.body.file_id;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

await fetch(`${supabaseUrl}/rest/v1/files?id=eq.${fileId}`, {
  method: 'PATCH',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  },
  body: JSON.stringify({
    extraction_status: 'completed',
    text_extracted_at: new Date().toISOString()
  })
});

return [{
  json: {
    success: true,
    file_id: fileId,
    message: 'PDF processed successfully'
  }
}];
```

---

## Part 2: Update File Upload Edge Function

Update the edge function to trigger PDF processing:

```typescript
// After file upload succeeds, trigger PDF processing
const pdfProcessorUrl = Deno.env.get('N8N_PDF_PROCESSOR_URL');

if (pdfProcessorUrl) {
  fetch(pdfProcessorUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_id: fileData.id,
      file_url: fileData.file_url,
      file_name: fileData.file_name,
      chapter_id: chapter_id,
      user_id: user_id
    })
  }).catch(err => console.error('PDF processor error:', err));
}
```

---

## Part 3: RAG Chat Workflow (Update Existing)

### Add RAG Retrieval to Chat Workflow

Insert these nodes BEFORE your Gemini LLM node:

#### New Node A: OpenAI (Embed Question)
```
Node: OpenAI
Resource: Embeddings
Model: text-embedding-3-small
Text: {{ $json.currentMessage }}
```

#### New Node B: Supabase (Search Similar Chunks)
```javascript
// Code node to call the match_pdf_chunks function
const questionEmbedding = $input.first().json.data[0].embedding;
const chapterId = $json.originalInput.chapter_id;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const response = await fetch(
  `${supabaseUrl}/rest/v1/rpc/match_pdf_chunks`,
  {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query_embedding: JSON.stringify(questionEmbedding),
      match_chapter_id: chapterId,
      match_threshold: 0.5,
      match_count: 5
    })
  }
);

const relevantChunks = await response.json();

return [{
  json: {
    ...($json),
    relevantChunks: relevantChunks,
    hasContext: relevantChunks && relevantChunks.length > 0
  }
}];
```

#### New Node C: Code (Format Context)
```javascript
// Add relevant context to the prompt
let prompt = $json.prompt || '';
const chunks = $json.relevantChunks || [];

if (chunks.length > 0) {
  let context = '\n\n=== RELEVANT CONTENT FROM YOUR STUDY MATERIALS ===\n\n';
  
  chunks.forEach((chunk, idx) => {
    context += `[Source ${idx + 1} - Similarity: ${(chunk.similarity * 100).toFixed(1)}%]\n`;
    context += chunk.chunk_text;
    context += '\n\n';
  });
  
  context += '=== END OF RELEVANT CONTENT ===\n\n';
  context += 'Based on the above content from your study materials, please answer the following question:\n\n';
  
  // Insert context before the current question
  const lastUserMessage = prompt.lastIndexOf('User:');
  if (lastUserMessage !== -1) {
    prompt = prompt.substring(0, lastUserMessage) + context + prompt.substring(lastUserMessage);
  } else {
    prompt = context + prompt;
  }
}

return [{
  json: {
    ...($json),
    prompt: prompt
  }
}];
```

---

## Part 4: Updated Chat Flow

Your complete chat workflow should now be:

```
1. Webhook
2. Format Messages (history)
3. Embed Question (OpenAI)          ← NEW
4. Search Chunks (Supabase RPC)     ← NEW
5. Add Context to Prompt            ← NEW
6. Gemini LLM
7. Format Response
8. Respond to Webhook
```

---

## 🧪 Testing

### Test PDF Processing

1. Upload a PDF in StudAI
2. Check n8n executions for "StudAI PDF Processor"
3. Verify chunks in database:
```sql
SELECT COUNT(*) FROM pdf_chunks WHERE chapter_id = 'your-chapter-id';
```

### Test RAG Chat

1. Upload a PDF with specific content
2. Wait for processing to complete
3. Ask: "What does the document say about [specific topic]?"
4. The AI should quote or reference the actual PDF content!

---

## 💰 Cost Estimates

**Per 10-page PDF:**
- Text extraction (pdf.co): $0.001
- Embeddings (OpenAI): ~$0.01 (for ~50 chunks)
- **Total: ~$0.011 per PDF**

**Per Chat Message:**
- Question embedding: $0.0001
- LLM response: $0.001-0.01
- **Total: ~$0.001-0.01 per message**

Very affordable!

---

## 🔧 Troubleshooting

### No chunks returned
- Check embeddings are stored correctly
- Lower match_threshold from 0.5 to 0.3
- Verify vector index is created

### PDF extraction fails
- Check signed URL is valid
- Verify pdf.co API key
- Try different PDF parsing service

### High costs
- Reduce chunk_count from 5 to 3
- Increase chunk size from 800 to 1200
- Use cheaper embedding model

---

## 📊 Monitoring

Check these metrics:
- PDF processing success rate
- Average chunks per PDF
- RAG retrieval quality
- Response relevance

---

**Guide Version:** 1.0  
**Last Updated:** October 30, 2025

