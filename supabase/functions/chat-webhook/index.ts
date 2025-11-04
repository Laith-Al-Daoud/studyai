/**
 * Chat Webhook Edge Function
 * 
 * Handles chat message processing via n8n LLM workflow.
 * 
 * Flow:
 * 1. Receives chat message and context from server action
 * 2. Verifies webhook signature for security
 * 3. Forwards to n8n workflow for LLM processing
 * 4. Updates chat record with LLM response
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

interface FileContext {
  id: string;
  file_name: string;
  file_url: string;
}

interface HistoryMessage {
  message: string;
  response: string;
  created_at: string;
}

interface ChatPayload {
  chat_id: string;
  user_id: string;
  chapter_id: string;
  message: string;
  files?: FileContext[];
  history?: HistoryMessage[];
}

interface N8nResponse {
  response: string;
  meta?: Record<string, unknown>;
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

    // Parse the request payload
    const payload: ChatPayload = JSON.parse(rawBody);

    // Validate required fields
    if (!payload.chat_id || !payload.user_id || !payload.chapter_id || !payload.message) {
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
    if (!isValidUUID(payload.chat_id) || !isValidUUID(payload.user_id) || !isValidUUID(payload.chapter_id)) {
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

    // Sanitize message input
    const sanitizedMessage = sanitizeInput(payload.message);
    if (!sanitizedMessage) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid message content' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check rate limiting
    const rateLimitExceeded = await isRateLimited(
      supabase,
      payload.user_id,
      'chat-webhook',
      30, // 30 requests
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

    console.log('Chat webhook received:', {
      chat_id: payload.chat_id,
      chapter_id: payload.chapter_id,
      message_preview: sanitizedMessage.substring(0, 50) + '...',
      file_count: payload.files?.length || 0,
    });

    // Get n8n webhook URL from environment
    const n8nWebhookUrl = Deno.env.get('N8N_CHAT_WEBHOOK_URL');

    if (!n8nWebhookUrl) {
      console.warn('N8N_CHAT_WEBHOOK_URL not configured, using mock response');
      
      // Mock response for testing without n8n
      const mockResponse = `I've received your question: "${sanitizedMessage.substring(0, 100)}..."

Based on your uploaded materials (${payload.files?.length || 0} files), I can help you understand this topic better. 

Note: This is a mock response. Configure N8N_CHAT_WEBHOOK_URL environment variable to enable real LLM integration.`;

      const { error: updateError } = await supabase
        .from('chats')
        .update({
          response: mockResponse,
          meta: {
            is_mock: true,
            processed_at: new Date().toISOString(),
          },
        })
        .eq('id', payload.chat_id);

      if (updateError) {
        console.error('Error updating chat with mock response:', updateError);
        throw new Error('Failed to update chat record');
      }

      // Log security event
      await logSecurityEvent(
        supabase,
        payload.user_id,
        'chat_message_mock',
        'chats',
        payload.chat_id
      );

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Mock response generated',
          is_mock: true,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Prepare n8n payload
    const n8nPayload = {
      chat_id: payload.chat_id,
      user_id: payload.user_id,
      chapter_id: payload.chapter_id,
      message: sanitizedMessage,
      files: payload.files || [],
      history: payload.history || [],
      timestamp: new Date().toISOString(),
    };

    // Generate signature for n8n webhook
    const n8nSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
    const n8nHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (n8nSecret) {
      const n8nSignature = await generateWebhookSignature(
        JSON.stringify(n8nPayload),
        n8nSecret
      );
      n8nHeaders['x-webhook-signature'] = n8nSignature;
    }

    // Call n8n webhook with the chat payload
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: n8nHeaders,
      body: JSON.stringify(n8nPayload),
    });

    if (!n8nResponse.ok) {
      console.error('n8n webhook failed:', n8nResponse.status, n8nResponse.statusText);
      throw new Error('n8n webhook request failed');
    }

    const n8nData: N8nResponse = await n8nResponse.json();

    // Update the chat record with the LLM response
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('chats')
      .update({
        response: n8nData.response,
        meta: {
          ...n8nData.meta,
          processed_at: new Date().toISOString(),
        },
      })
      .eq('id', payload.chat_id);

    if (updateError) {
      console.error('Error updating chat record:', updateError);
      throw new Error('Failed to update chat record');
    }

    // Log security event
    await logSecurityEvent(
      supabase,
      payload.user_id,
      'chat_message_processed',
      'chats',
      payload.chat_id
    );

    console.log('Chat processed successfully:', payload.chat_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Chat processed successfully',
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
    
    console.error('Error in chat-webhook:', error);
    
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

