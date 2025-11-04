/**
 * File Upload Webhook Edge Function
 * 
 * Triggered after PDF upload, forwards file metadata to n8n workflow
 * Implements security checks and webhook signature verification
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { 
  verifyWebhookSignature, 
  sanitizeInput, 
  isValidUUID, 
  isRateLimited,
  getSecureCorsHeaders,
  getSafeErrorMessage,
  logSecurityEvent,
  generateWebhookSignature
} from '../_shared/security.ts';

// Get allowed origins from environment (comma-separated)
const allowedOriginsStr = Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:3000';
const allowedOrigins = allowedOriginsStr.split(',').map(o => o.trim());

interface FileUploadPayload {
  user_id: string;
  subject_id: string;
  chapter_id: string;
  file_id: string;
  file_url: string;
  file_name: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getSecureCorsHeaders(origin, allowedOrigins);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const isDevelopment = Deno.env.get('ENVIRONMENT') !== 'production';
    
    // Get raw body for signature verification
    const rawBody = await req.text();
    
    // Verify webhook signature if secret is configured
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    if (webhookSecret) {
      const signature = req.headers.get('x-webhook-signature');
      const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
      
      if (!isValid) {
        console.warn('Invalid webhook signature detected');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid signature' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401 
          }
        );
      }
    }

    // Parse request body
    const payload: FileUploadPayload = JSON.parse(rawBody);

    // Validate required fields
    if (!payload.user_id || !payload.chapter_id || !payload.file_url || !payload.file_name) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Validate UUIDs
    if (!isValidUUID(payload.user_id) || !isValidUUID(payload.chapter_id)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid ID format' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Sanitize filename
    const sanitizedFilename = sanitizeInput(payload.file_name);
    if (!sanitizedFilename) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid filename' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Initialize Supabase client to get signed URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check rate limiting
    const rateLimitExceeded = await isRateLimited(
      supabase,
      payload.user_id,
      'file-upload-webhook',
      10, // 10 file uploads
      1   // per minute
    );

    if (rateLimitExceeded) {
      console.warn('Rate limit exceeded for user:', payload.user_id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 
        }
      );
    }

    // Generate a long-lived signed URL for n8n to download the file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('pdfs')
      .createSignedUrl(payload.file_url, 604800); // 7 days

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create signed URL' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Trigger PDF processing workflow (if configured)
    const pdfProcessorUrl = Deno.env.get('N8N_PDF_PROCESSOR_URL');
    const n8nSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
    
    if (pdfProcessorUrl && payload.file_id) {
      console.log('Triggering PDF processor:', pdfProcessorUrl);
      
      const pdfPayload = {
        file_id: payload.file_id,
        file_url: payload.file_url,
        file_name: sanitizedFilename,
        chapter_id: payload.chapter_id,
        user_id: payload.user_id,
        signedUrl: signedUrlData.signedUrl
      };

      const pdfHeaders: Record<string, string> = { 
        'Content-Type': 'application/json' 
      };

      if (n8nSecret) {
        const signature = await generateWebhookSignature(
          JSON.stringify(pdfPayload),
          n8nSecret
        );
        pdfHeaders['x-webhook-signature'] = signature;
      }

      fetch(pdfProcessorUrl, {
        method: 'POST',
        headers: pdfHeaders,
        body: JSON.stringify(pdfPayload)
      }).catch(err => console.error('PDF processor error:', err));
    } else {
      console.log('PDF processor not configured or missing file_id');
    }

    // Trigger flashcards generation workflow
    const flashcardsWebhookUrl = Deno.env.get('N8N_FLASHCARDS_WEBHOOK_URL') || 'https://laithaldaoud.app.n8n.cloud/webhook/flashcards';
    if (payload.file_id) {
      console.log('Triggering flashcards generation:', flashcardsWebhookUrl);
      try {
        const flashcardsPayload = {
          url: payload.file_url
        };

        const flashcardsHeaders: Record<string, string> = { 
          'Content-Type': 'application/json' 
        };

        if (n8nSecret) {
          const signature = await generateWebhookSignature(
            JSON.stringify(flashcardsPayload),
            n8nSecret
          );
          flashcardsHeaders['x-webhook-signature'] = signature;
        }

        const flashcardsResponse = await fetch(flashcardsWebhookUrl, {
          method: 'POST',
          headers: flashcardsHeaders,
          body: JSON.stringify(flashcardsPayload)
        });

        if (flashcardsResponse.ok) {
          const flashcardsData = await flashcardsResponse.json();
          console.log('Flashcards received - Full response:', JSON.stringify(flashcardsData, null, 2));

          // Parse the response and insert flashcards into the database
          // The actual response format from n8n is: { "output": { "flashcards": [...] } }
          
          // Extract output object (handle both object and array formats)
          let output;
          if (Array.isArray(flashcardsData)) {
            console.log('Response is an array with', flashcardsData.length, 'elements');
            output = flashcardsData[0]?.output;
          } else if (typeof flashcardsData === 'object' && flashcardsData !== null) {
            console.log('Response is an object with keys:', Object.keys(flashcardsData));
            output = flashcardsData.output;
          } else {
            console.error('Unexpected response type:', typeof flashcardsData);
            output = null;
          }

          if (!output) {
            console.error('No output object found in response');
          } else {
            console.log('Output object found with keys:', Object.keys(output));
            
            if (!Array.isArray(output.flashcards)) {
              console.error('output.flashcards is not an array. Type:', typeof output.flashcards);
              console.error('Output object:', JSON.stringify(output, null, 2));
            } else if (output.flashcards.length === 0) {
              console.error('output.flashcards is an empty array');
            } else {
              console.log('Found', output.flashcards.length, 'flashcards to insert');
              const flashcardsToInsert = output.flashcards.map((fc: { id: string, question: string, answer: string }) => ({
                chapter_id: payload.chapter_id,
                file_id: payload.file_id,
                flashcard_id: fc.id,
                question: fc.question,
                answer: fc.answer,
              }));

              console.log('Flashcards to insert (first 2):', JSON.stringify(flashcardsToInsert.slice(0, 2), null, 2));

              // Insert flashcards into database
              const { data: insertedFlashcards, error: insertError } = await supabase
                .from('flashcards')
                .insert(flashcardsToInsert)
                .select();

              if (insertError) {
                console.error('Error inserting flashcards:', insertError);
                console.error('Insert error details:', JSON.stringify(insertError, null, 2));
              } else {
                console.log(`✅ Successfully inserted ${insertedFlashcards?.length || 0} flashcards`);
                console.log('Inserted flashcard IDs:', insertedFlashcards?.map(fc => fc.id));
              }
            }
          }
        } else {
          console.error('Flashcards webhook failed with status:', flashcardsResponse.status);
          const errorText = await flashcardsResponse.text();
          console.error('Error response:', errorText);
        }
      } catch (err) {
        console.error('Flashcards generation error:', err);
      }
    }

    // Also trigger general file upload webhook (if configured)
    const n8nWebhookUrl = Deno.env.get('N8N_FILE_UPLOAD_WEBHOOK_URL');
    if (n8nWebhookUrl) {
      const n8nPayload = {
        event: 'file_upload',
        timestamp: new Date().toISOString(),
        user_id: payload.user_id,
        subject_id: payload.subject_id,
        chapter_id: payload.chapter_id,
        file_name: sanitizedFilename,
        file_url: signedUrlData.signedUrl,
      };

      const n8nHeaders: Record<string, string> = { 
        'Content-Type': 'application/json' 
      };

      if (n8nSecret) {
        const signature = await generateWebhookSignature(
          JSON.stringify(n8nPayload),
          n8nSecret
        );
        n8nHeaders['x-webhook-signature'] = signature;
      }

      // Forward to n8n webhook (don't await, fire and forget)
      fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: n8nHeaders,
        body: JSON.stringify(n8nPayload),
      }).catch(err => console.error('n8n webhook error:', err));
    }

    // Log security event
    await logSecurityEvent(
      supabase,
      payload.user_id,
      'file_uploaded',
      'files',
      payload.file_id
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'File upload processed',
        pdf_processor_triggered: !!pdfProcessorUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const isDevelopment = Deno.env.get('ENVIRONMENT') !== 'production';
    const origin = req.headers.get('origin');
    const corsHeaders = getSecureCorsHeaders(origin, allowedOrigins);
    
    console.error('Error in file-upload-webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: getSafeErrorMessage(error, isDevelopment)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

