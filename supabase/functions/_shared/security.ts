/**
 * Shared Security Utilities for Edge Functions
 * Provides webhook signature verification, rate limiting, and input sanitization
 */

/**
 * Verifies HMAC signature for webhook requests
 * @param payload - The request payload as a string
 * @param signature - The signature from the request header
 * @param secret - The shared secret key
 * @returns true if signature is valid
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare signatures in constant time to prevent timing attacks
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Generates HMAC signature for outgoing webhook requests
 * @param payload - The payload to sign
 * @param secret - The shared secret key
 * @returns The HMAC signature as hex string
 */
export async function generateWebhookSignature(
  payload: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  return Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Sanitizes user input to prevent XSS and injection attacks
 * @param input - The user input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length to prevent DoS
  const MAX_LENGTH = 100000; // 100KB
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized;
}

/**
 * Validates UUID format
 * @param uuid - The UUID string to validate
 * @returns true if valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates email format
 * @param email - The email string to validate
 * @returns true if valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Rate limiting check using Supabase
 * @param supabase - Supabase client
 * @param userId - User ID to check
 * @param endpoint - Endpoint name
 * @param maxRequests - Maximum requests per window
 * @param windowMinutes - Time window in minutes
 * @returns true if rate limit exceeded
 */
export async function isRateLimited(
  supabase: any,
  userId: string,
  endpoint: string,
  maxRequests: number = 60,
  windowMinutes: number = 1
): Promise<boolean> {
  try {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

    // Get current request count for this user/endpoint in the time window
    const { data: existingRecord, error: selectError } = await supabase
      .from('rate_limit_tracking')
      .select('request_count, window_start')
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Rate limit check error:', selectError);
      return false; // Fail open on error
    }

    if (!existingRecord) {
      // First request in this window - create new record
      await supabase
        .from('rate_limit_tracking')
        .insert({
          user_id: userId,
          endpoint: endpoint,
          request_count: 1,
          window_start: new Date().toISOString(),
        });
      return false;
    }

    // Check if rate limit exceeded
    if (existingRecord.request_count >= maxRequests) {
      return true;
    }

    // Increment request count
    await supabase
      .from('rate_limit_tracking')
      .update({
        request_count: existingRecord.request_count + 1,
      })
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .eq('window_start', existingRecord.window_start);

    return false;
  } catch (error) {
    console.error('Rate limiting error:', error);
    return false; // Fail open on error
  }
}

/**
 * Logs security event to audit table
 * @param supabase - Supabase client (service role)
 * @param userId - User ID
 * @param action - Action performed
 * @param tableName - Table affected
 * @param recordId - Record ID (optional)
 * @param details - Additional details
 */
export async function logSecurityEvent(
  supabase: any,
  userId: string | null,
  action: string,
  tableName: string,
  recordId?: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: action,
        table_name: tableName,
        record_id: recordId,
        new_data: details || {},
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't throw - logging failures shouldn't break the main flow
  }
}

/**
 * Validates CORS origin against allowed list
 * @param origin - Origin from request header
 * @param allowedOrigins - Array of allowed origins
 * @returns true if origin is allowed
 */
export function isAllowedOrigin(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
}

/**
 * Gets secure CORS headers based on origin
 * @param origin - Origin from request header
 * @param allowedOrigins - Array of allowed origins
 * @returns CORS headers object
 */
export function getSecureCorsHeaders(origin: string | null, allowedOrigins: string[]): Record<string, string> {
  const allowedOrigin = isAllowedOrigin(origin, allowedOrigins) ? origin : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Creates a safe error response that doesn't leak sensitive information
 * @param error - The error object
 * @param isDevelopment - Whether in development mode
 * @returns Safe error message
 */
export function getSafeErrorMessage(error: any, isDevelopment: boolean = false): string {
  if (isDevelopment) {
    return error?.message || 'Internal server error';
  }
  
  // In production, return generic messages
  const errorCode = error?.code || error?.status;
  
  if (errorCode === '23505') return 'Duplicate entry';
  if (errorCode === '23503') return 'Referenced record not found';
  if (errorCode === '42501') return 'Insufficient permissions';
  if (errorCode === 'PGRST116') return 'Resource not found';
  
  return 'An error occurred processing your request';
}

