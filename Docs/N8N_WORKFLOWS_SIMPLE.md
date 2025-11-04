# Simplified n8n RAG Workflows - StudAI

**Easy-to-follow guide with exact node configurations**

---

## 🎯 What You'll Build

1. **PDF Processor Workflow** - Extracts text, creates embeddings, stores in DB
2. **Enhanced Chat Workflow** - Searches PDFs for relevant context before answering

---

## Workflow 1: PDF Processor (New Workflow)

### Create New Workflow
- Name: `StudAI PDF Processor`
- Click "Save"

### Node Configuration (10 Nodes Total)

---

#### Node 1: Webhook
```
Type: Webhook
Method: POST
Path: pdf-process
Authentication: None
Response Mode: When Last Node Finishes
```

**After configuring, copy the Production URL!**

---

#### Node 2: HTTP Request - Get Signed URL
```
Type: HTTP Request
Method: POST
URL: YOUR_SUPABASE_URL/storage/v1/object/sign/pdfs/{{ $json.body.file_url }}?expiresIn=3600
Headers:
  Authorization: Bearer YOUR_SUPABASE_ANON_KEY
  Content-Type: application/json
```

**Replace:**
- `YOUR_SUPABASE_URL` with your Supabase URL
- `YOUR_SUPABASE_ANON_KEY` with your anon key

---

#### Node 3: Code - Format Signed URL
```javascript
const signedUrlResponse = $input.first().json;
const supabaseUrl = 'YOUR_SUPABASE_URL';
const signedPath = signedUrlResponse.signedURL;
const fullUrl = `${supabaseUrl}/storage/v1${signedPath}`;

return [{
  json: {
    ...($('Webhook').first().json.body),
    downloadUrl: fullUrl
  }
}];
```

---

#### Node 4: HTTP Request - Download PDF
```
Type: HTTP Request
Method: GET
URL: {{ $json.downloadUrl }}
Response Format: File
```

---

#### Node 5: Extract PDF Text (n8n PDF Node)
```
Type: Extract from File
Operation: Extract Text from PDF
Binary Property: data
Output Property Name: extractedText
```

**That's it! n8n extracts the text automatically!**

---

#### Node 6: Code - Prepare Data & Split into Chunks
```javascript
// Get extracted text from PDF node
const extractedText = $input.first().json.extractedText || '';

// Get original webhook data
const webhookData = $('Webhook').first().json.body;

// Configuration
const chunkSize = 800;
const overlap = 100;

const chunks = [];
let start = 0;
let index = 0;

// Split text into overlapping chunks
while (start < extractedText.length) {
  const end = Math.min(start + chunkSize, extractedText.length);
  const chunk = extractedText.substring(start, end);
  
  if (chunk.length > 100) {
    chunks.push({
      file_id: webhookData.file_id,
      chapter_id: webhookData.chapter_id,
      chunk_text: chunk,
      chunk_index: index,
      metadata: {
        file_name: webhookData.file_name,
        total_length: extractedText.length
      }
    });
    index++;
  }
  
  start += (chunkSize - overlap);
}

return chunks.map(chunk => ({ json: chunk }));
```

---

#### Node 7: Loop Over Items (Split in Batches)
```
Type: Split In Batches
Batch Size: 10
```

**This processes embeddings in batches of 10 chunks at a time**

---

#### Node 8: OpenAI - Create Embeddings
```
Type: OpenAI
Resource: Embeddings
Model: text-embedding-3-small
Text: {{ $json.chunk_text }}
```

**Add your OpenAI API key as a credential**

---

#### Node 8: Code - Format for Database
```javascript
const embedding = $input.first().json.data[0].embedding;

return [{
  json: {
    file_id: $json.file_id,
    chapter_id: $json.chapter_id,
    chunk_text: $json.chunk_text,
    chunk_index: $json.chunk_index,
    embedding: JSON.stringify(embedding),
    metadata: $json.metadata
  }
}];
```

---

#### Node 9: HTTP Request - Insert to Supabase
```
Type: HTTP Request
Method: POST
URL: YOUR_SUPABASE_URL/rest/v1/pdf_chunks
Headers:
  apikey: YOUR_SUPABASE_SERVICE_ROLE_KEY
  Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
  Content-Type: application/json
  Prefer: return=minimal

Body (JSON):
{
  "file_id": "{{ $json.file_id }}",
  "chapter_id": "{{ $json.chapter_id }}",
  "chunk_text": "{{ $json.chunk_text }}",
  "chunk_index": {{ $json.chunk_index }},
  "embedding": {{ $json.embedding }},
  "metadata": {{ JSON.stringify($json.metadata) }}
}
```

---

### Activate the Workflow!

Click the toggle in the top-right to turn it ON.

---

## Workflow 2: Enhanced Chat (Update Existing)

Your existing chat workflow gets these new nodes INSERTED:

### Current Flow:
```
Webhook → Format Messages → Gemini → Format Response → Respond
```

### New Flow:
```
Webhook → Format Messages → 
  ↓
[NEW] Embed Question → 
  ↓
[NEW] Search PDF Chunks → 
  ↓
[NEW] Add Context → 
  ↓
Gemini → Format Response → Respond
```

---

### NEW Node A: OpenAI - Embed Question

**Insert AFTER "Format Messages"**

```
Type: OpenAI
Resource: Embeddings
Model: text-embedding-3-small
Text: {{ $json.currentMessage }}
```

---

### NEW Node B: HTTP Request - Search Chunks

**Insert AFTER "Embed Question"**

```
Type: HTTP Request
Method: POST
URL: YOUR_SUPABASE_URL/rest/v1/rpc/match_pdf_chunks
Headers:
  apikey: YOUR_SUPABASE_SERVICE_ROLE_KEY
  Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
  Content-Type: application/json

Body (JSON):
{
  "query_embedding": "{{ JSON.stringify($input.first().json.data[0].embedding) }}",
  "match_chapter_id": "{{ $('Format Messages').first().json.originalInput.chapter_id }}",
  "match_threshold": 0.3,
  "match_count": 3
}
```

---

### NEW Node C: Code - Add Context to Prompt

**Insert AFTER "Search Chunks", BEFORE "Gemini"**

```javascript
// Get the formatted prompt
let prompt = $('Format Messages').first().json.prompt || '';

// Get search results
const chunks = $input.first().json || [];

// Add relevant context if found
if (chunks && chunks.length > 0) {
  let context = '\n\n=== RELEVANT CONTENT FROM YOUR STUDY MATERIALS ===\n\n';
  
  chunks.forEach((chunk, idx) => {
    const similarity = (chunk.similarity * 100).toFixed(1);
    context += `[Source ${idx + 1} - Relevance: ${similarity}%]\n`;
    context += chunk.chunk_text;
    context += '\n\n---\n\n';
  });
  
  context += '=== END OF RELEVANT CONTENT ===\n\n';
  context += 'Please answer based on the above content:\n\n';
  
  // Add context before the last user message
  const lastUserIndex = prompt.lastIndexOf('User:');
  if (lastUserIndex !== -1) {
    prompt = prompt.substring(0, lastUserIndex) + 
             context + 
             prompt.substring(lastUserIndex);
  } else {
    prompt = context + prompt;
  }
}

return [{
  json: {
    ...($('Format Messages').first().json),
    prompt: prompt,
    foundContext: chunks && chunks.length > 0,
    contextCount: chunks ? chunks.length : 0
  }
}];
```

---

### Update Your Gemini Node

Make sure it uses: `{{ $json.prompt }}`

---

## 🔧 Setup Steps

### 1. Set Supabase Secrets

```bash
cd studai
npx supabase secrets set N8N_PDF_PROCESSOR_URL=https://your-n8n/webhook/pdf-process
```

(Replace with your PDF Processor webhook URL from Node 1)

### 2. Test PDF Processing

1. Upload a PDF in StudAI
2. Check n8n executions tab
3. Verify chunks in database:
```sql
SELECT * FROM pdf_chunks LIMIT 5;
```

### 3. Test RAG Chat

1. Ask: "What does my PDF say about [topic]?"
2. AI should reference actual PDF content!

---

## 🎯 PDF Extraction

**Good news!** n8n has a built-in "Extract from File" node that handles PDF text extraction automatically. No external API needed!

If you need more advanced features (OCR, tables, etc.), you can optionally use:
- **pdf.co** - Simple API for complex PDFs
- **Google Document AI** - Best for scanned documents
- **AWS Textract** - Enterprise-grade extraction

---

## 📊 Expected Costs

**Per 20-page PDF:**
- Text extraction: **$0** (n8n built-in - FREE!)
- Embeddings (50 chunks): $0.01
- **Total: ~$0.01 per PDF**

**Per Chat with RAG:**
- Question embedding: $0.0001
- LLM response: $0.001-0.01
- **Total: ~$0.001-0.01 per message**

---

## ✅ Testing Checklist

- [ ] SQL scripts run successfully
- [ ] PDF Processor workflow created
- [ ] PDF Processor webhook URL set in Supabase
- [ ] OpenAI API key configured in n8n
- [ ] Upload test PDF - check execution
- [ ] Verify chunks in database
- [ ] Chat workflow updated with RAG
- [ ] Test question about PDF content
- [ ] AI references actual PDF content!

---

## 🐛 Troubleshooting

**No chunks found:**
- Lower match_threshold to 0.2
- Check embeddings are actually stored
- Verify chapter_id matches

**PDF extraction fails:**
- Check signed URL is accessible
- Verify PDF is valid
- Try different extraction service

**Workflow times out:**
- Process PDFs in smaller chunks
- Reduce batch size for embeddings
- Check n8n execution limits

---

**Last Updated:** October 30, 2025  
**Version:** 1.0

