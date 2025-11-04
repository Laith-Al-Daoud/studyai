# StudAI Security Guide

**Version:** 1.0  
**Last Updated:** November 3, 2025  
**Stage 5 Implementation**

---

## Table of Contents

1. [Overview](#overview)
2. [Security Features](#security-features)
3. [Environment Configuration](#environment-configuration)
4. [Webhook Security](#webhook-security)
5. [Row-Level Security (RLS)](#row-level-security-rls)
6. [Rate Limiting](#rate-limiting)
7. [Security Headers](#security-headers)
8. [Input Sanitization](#input-sanitization)
9. [Testing Security](#testing-security)
10. [Security Checklist](#security-checklist)

---

## Overview

This document outlines the security measures implemented in StudAI to protect user data and prevent common web vulnerabilities. Stage 5 focuses on hardening the application's security posture.

---

## Security Features

### Implemented Security Layers

1. **Row-Level Security (RLS)** - Database-level access control
2. **Webhook Signature Verification** - HMAC-SHA256 signed requests
3. **Rate Limiting** - Prevents abuse and DoS attacks
4. **Content Security Policy (CSP)** - Prevents XSS attacks
5. **Security Headers** - HSTS, X-Frame-Options, etc.
6. **Input Sanitization** - Prevents injection attacks
7. **Audit Logging** - Security event tracking
8. **CORS Configuration** - Restricts cross-origin requests

---

## Environment Configuration

### Required Environment Variables

#### Next.js Application (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# n8n Webhooks
N8N_CHAT_WEBHOOK_URL=https://your-n8n.com/webhook/chat
N8N_FILE_UPLOAD_WEBHOOK_URL=https://your-n8n.com/webhook/file-upload
N8N_PDF_PROCESSOR_URL=https://your-n8n.com/webhook/pdf-processor
N8N_FLASHCARDS_WEBHOOK_URL=https://your-n8n.com/webhook/flashcards

# Security
WEBHOOK_SECRET=your-webhook-secret-32-chars-min
N8N_WEBHOOK_SECRET=your-n8n-secret-32-chars-min
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
ENVIRONMENT=production

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### Edge Functions (Supabase Dashboard)

Configure in Supabase Dashboard → Edge Functions → Settings:

- `N8N_CHAT_WEBHOOK_URL`
- `N8N_FILE_UPLOAD_WEBHOOK_URL`
- `N8N_PDF_PROCESSOR_URL`
- `N8N_FLASHCARDS_WEBHOOK_URL`
- `WEBHOOK_SECRET`
- `N8N_WEBHOOK_SECRET`
- `ALLOWED_ORIGINS`
- `ENVIRONMENT`

### Generating Secure Secrets

```bash
# Generate webhook secret (32 bytes = 64 hex characters)
openssl rand -hex 32

# Generate webhook secret (base64 format)
openssl rand -base64 32
```

**Important:** Use different secrets for development and production.

---

## Webhook Security

### HMAC Signature Verification

All webhook communications use HMAC-SHA256 signatures to verify authenticity.

#### Outgoing Requests (Edge Functions → n8n)

Edge Functions automatically sign outgoing webhook requests:

```typescript
// Automatically handled by Edge Functions
headers['x-webhook-signature'] = generateSignature(payload, secret)
```

#### Incoming Requests (Client → Edge Functions)

Edge Functions verify incoming signatures:

```typescript
const signature = req.headers.get('x-webhook-signature')
const isValid = await verifyWebhookSignature(body, signature, secret)
```

#### Implementing Signature Verification in n8n

If you need to verify signatures in n8n workflows:

```javascript
// n8n Function Node
const crypto = require('crypto');

const payload = JSON.stringify($json);
const signature = $node["Webhook"].json.headers["x-webhook-signature"];
const secret = '<your-secret>';

const hmac = crypto.createHmac('sha256', secret);
hmac.update(payload);
const expectedSignature = hmac.digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}

return $json;
```

---

## Row-Level Security (RLS)

### Policy Overview

All database tables have RLS enabled with comprehensive policies:

#### Subjects Table
- Users can only view, create, update, and delete their own subjects
- Verified via `auth.uid() = user_id`

#### Chapters Table
- Users can only access chapters in their own subjects
- Verified via JOIN with subjects table

#### Files Table
- Users can only access files in their own chapters
- Verified via JOIN with chapters and subjects

#### Chats Table
- Users can only view/manage their own chat messages
- Service role can update responses for n8n integration

#### PDF Chunks Table
- Users can view chunks for their own chapters
- Service role can insert/update chunks (for n8n processing)

#### Flashcards Table
- Users can view/manage flashcards in their own chapters
- Verified via JOIN with chapters and subjects

### Testing RLS Policies

```sql
-- Test as different user
SET LOCAL "request.jwt.claims" = '{"sub": "user-uuid-here"}';

-- Try to access another user's data
SELECT * FROM subjects WHERE user_id != 'user-uuid-here';
-- Should return no rows

-- Try to insert into another user's subject
INSERT INTO chapters (subject_id, title)
VALUES ('other-user-subject-id', 'Test');
-- Should fail
```

---

## Rate Limiting

### Implementation

Rate limiting is implemented at the Edge Function level using the `rate_limit_tracking` table.

### Default Limits

- **Chat Webhook:** 30 requests per minute per user
- **File Upload Webhook:** 10 uploads per minute per user

### Configuration

Limits are configured in Edge Functions:

```typescript
const rateLimitExceeded = await isRateLimited(
  supabase,
  userId,
  'endpoint-name',
  maxRequests,  // e.g., 30
  windowMinutes // e.g., 1
)
```

### Monitoring Rate Limits

```sql
-- View rate limit tracking
SELECT 
  user_id, 
  endpoint, 
  request_count, 
  window_start 
FROM rate_limit_tracking
WHERE window_start > NOW() - INTERVAL '1 hour'
ORDER BY request_count DESC;
```

### Cleanup

Old rate limit data is automatically cleaned up:

```sql
-- Manual cleanup (older than 24 hours)
SELECT cleanup_old_rate_limits();
```

---

## Security Headers

### Implemented Headers

All responses include comprehensive security headers:

#### Content Security Policy (CSP)
- Prevents XSS attacks
- Restricts script sources
- Uses nonce-based script execution

#### HTTP Strict Transport Security (HSTS)
- Forces HTTPS connections
- `max-age=31536000; includeSubDomains; preload`

#### X-Frame-Options
- Prevents clickjacking
- Set to `DENY`

#### X-Content-Type-Options
- Prevents MIME type sniffing
- Set to `nosniff`

#### Referrer-Policy
- Limits referrer information
- `strict-origin-when-cross-origin`

#### Permissions-Policy
- Restricts browser features
- Disables camera, microphone, geolocation

### Testing Security Headers

```bash
# Check security headers
curl -I https://your-domain.com

# Use online tools
https://securityheaders.com
```

---

## Input Sanitization

### Sanitization Functions

All user inputs are sanitized using the `sanitizeInput` function:

```typescript
// Removes null bytes, trims whitespace, limits length
const sanitized = sanitizeInput(userInput)
```

### Validation Functions

Additional validation for specific data types:

- `isValidUUID(uuid)` - Validates UUID format
- `isValidEmail(email)` - Validates email format

### Implementation Points

1. **Edge Functions** - All webhook payloads
2. **Server Actions** - All form submissions
3. **API Routes** - All request parameters

---

## Testing Security

### Manual Security Tests

#### Test 1: Cross-Account Access

```sql
-- Create two test users
-- Log in as User A
-- Try to access User B's data via direct API calls

-- Should fail due to RLS
SELECT * FROM subjects WHERE user_id = '<user-b-id>';
```

#### Test 2: Invalid Webhook Signatures

```bash
# Send request without signature
curl -X POST https://your-project.supabase.co/functions/v1/chat-webhook \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "test"}'
# Should return 401 Unauthorized
```

#### Test 3: Rate Limiting

```bash
# Send rapid requests (>30 in 1 minute)
for i in {1..35}; do
  curl -X POST https://your-api/endpoint
done
# Should return 429 Too Many Requests after limit
```

#### Test 4: SQL Injection

```typescript
// Try SQL injection in inputs
const maliciousInput = "'; DROP TABLE subjects; --"
const result = await createSubject(maliciousInput)
// Should be safely handled by parameterized queries
```

#### Test 5: XSS Attacks

```typescript
// Try XSS in subject title
const xssInput = "<script>alert('XSS')</script>"
const result = await createSubject(xssInput)
// Should be sanitized and displayed as text
```

### Automated Security Testing

```bash
# Run security audit tools
npm audit

# Check for vulnerable dependencies
npm audit fix

# Use OWASP ZAP for penetration testing
# https://www.zaproxy.org/
```

---

## Security Checklist

### Pre-Deployment Security Checklist

- [ ] All RLS policies tested and verified
- [ ] Webhook secrets configured and rotated
- [ ] Rate limiting tested and configured
- [ ] CORS origins restricted to production domains
- [ ] Environment variables secured (no secrets in code)
- [ ] Security headers verified with online tools
- [ ] CSP tested and not breaking functionality
- [ ] Input sanitization implemented on all endpoints
- [ ] Audit logging enabled and monitored
- [ ] Error messages don't leak sensitive information
- [ ] File upload validation (type, size) working
- [ ] Signed URLs tested with expiration
- [ ] Authentication edge cases tested
- [ ] Cross-account access tests passed
- [ ] SQL injection tests passed
- [ ] XSS attack tests passed

### Post-Deployment Monitoring

- [ ] Monitor audit logs regularly
- [ ] Review rate limit violations
- [ ] Check for unusual authentication patterns
- [ ] Monitor file upload patterns
- [ ] Review error logs for security issues
- [ ] Test security headers periodically
- [ ] Rotate secrets quarterly
- [ ] Update dependencies regularly
- [ ] Review and update CSP as needed
- [ ] Test backup and recovery procedures

---

## Security Incident Response

### If a Security Issue is Discovered

1. **Immediate Actions:**
   - Assess the scope of the issue
   - Disable affected functionality if critical
   - Rotate compromised secrets immediately

2. **Investigation:**
   - Check audit logs for affected users
   - Identify the attack vector
   - Determine data exposure

3. **Remediation:**
   - Fix the vulnerability
   - Deploy the fix immediately
   - Notify affected users if data was exposed

4. **Prevention:**
   - Document the incident
   - Update security tests
   - Review similar vulnerabilities
   - Enhance monitoring

### Contact Information

For security issues, contact: [security@your-domain.com]

---

## Additional Resources

### Security Best Practices

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-deep-dive/auth-security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

### Security Tools

- [SecurityHeaders.com](https://securityheaders.com) - Test security headers
- [OWASP ZAP](https://www.zaproxy.org/) - Penetration testing
- [Burp Suite](https://portswigger.net/burp) - Security testing
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Dependency checking

---

**Maintained By:** Development Team  
**Next Review:** After production deployment

