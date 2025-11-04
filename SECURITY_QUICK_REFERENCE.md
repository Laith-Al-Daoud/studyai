# Security Quick Reference

**Stage 5 Security Hardening - Quick Reference Guide**

---

## 🚀 Quick Start

### Testing Security Features

```bash
# Run security test script
./scripts/test-security.sh

# Check security headers
curl -I http://localhost:3000

# Run dependency audit
npm audit
```

---

## 🔐 Security Secrets

### Generate Webhook Secrets

```bash
# Generate secure secret (recommended)
openssl rand -hex 32

# Alternative: base64 format
openssl rand -base64 32
```

### Environment Variables Setup

```bash
# Copy example file
cp .env.example .env.local

# Generate and set secrets
echo "WEBHOOK_SECRET=$(openssl rand -hex 32)" >> .env.local
echo "N8N_WEBHOOK_SECRET=$(openssl rand -hex 32)" >> .env.local
```

---

## 🗄️ Database Migration

### Apply Security Migration

```bash
# Using Supabase CLI
cd studai
supabase db reset

# Or apply specific migration
supabase migration up 20250101000007_security_enhancements
```

### Verify RLS Policies

```sql
-- Check enabled RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- View policies
SELECT * FROM pg_policies 
WHERE schemaname = 'public';
```

---

## 🔄 Edge Functions Deployment

### Deploy Updated Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy chat-webhook
supabase functions deploy file-upload-webhook
```

### Set Environment Variables

```bash
# Via Supabase CLI
supabase secrets set WEBHOOK_SECRET=your-secret-here
supabase secrets set N8N_WEBHOOK_SECRET=your-secret-here
supabase secrets set ALLOWED_ORIGINS=https://your-domain.com
supabase secrets set ENVIRONMENT=production

# Or via Dashboard: Settings → Edge Functions → Environment Variables
```

### Verify Function Configuration

```bash
# List secrets
supabase secrets list

# Test function
curl -X POST https://your-project.supabase.co/functions/v1/chat-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: test" \
  -d '{"test": "data"}'
```

---

## 🧪 Security Testing

### Manual Tests Checklist

```bash
# 1. Test security headers
curl -I https://your-domain.com | grep -i "security\|csp\|frame\|content-type"

# 2. Test rate limiting
for i in {1..35}; do 
  curl -X POST https://your-api/endpoint; 
done
# Should get 429 after limit

# 3. Test invalid signature
curl -X POST https://your-project.supabase.co/functions/v1/chat-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: invalid" \
  -d '{"test": "data"}'
# Should get 401 Unauthorized

# 4. Test CORS
curl -H "Origin: https://evil-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS https://your-domain.com
# Should be blocked
```

---

## 📊 Monitoring

### Check Audit Logs

```sql
-- View recent security events
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 100;

-- View by user
SELECT * FROM audit_logs 
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC;

-- View by action type
SELECT action, COUNT(*) as count
FROM audit_logs
GROUP BY action
ORDER BY count DESC;
```

### Check Rate Limits

```sql
-- View active rate limits
SELECT 
  user_id, 
  endpoint, 
  request_count,
  window_start
FROM rate_limit_tracking
WHERE window_start > NOW() - INTERVAL '1 hour'
ORDER BY request_count DESC;

-- Find users hitting limits
SELECT user_id, endpoint, MAX(request_count) as max_requests
FROM rate_limit_tracking
GROUP BY user_id, endpoint
HAVING MAX(request_count) > 25
ORDER BY max_requests DESC;
```

---

## 🛠️ Troubleshooting

### CSP Issues

```javascript
// If CSP blocks legitimate resources, check browser console:
// "Refused to load ... because it violates the following Content Security Policy directive..."

// Temporary fix for development: Add to middleware.ts
// connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL} https://specific-domain.com
```

### Webhook Signature Failures

```bash
# 1. Verify secret is set
supabase secrets list | grep WEBHOOK_SECRET

# 2. Test signature generation (Node.js)
node -e "
const crypto = require('crypto');
const secret = 'your-secret';
const payload = JSON.stringify({test: 'data'});
const hmac = crypto.createHmac('sha256', secret);
hmac.update(payload);
console.log(hmac.digest('hex'));
"

# 3. Check Edge Function logs
supabase functions logs chat-webhook
```

### Rate Limiting Issues

```sql
-- Reset rate limits for user
DELETE FROM rate_limit_tracking 
WHERE user_id = 'user-uuid-here';

-- Adjust rate limits in Edge Function code
-- Edit: supabase/functions/*/index.ts
-- Change: isRateLimited(supabase, userId, 'endpoint', 30, 1)
--     to: isRateLimited(supabase, userId, 'endpoint', 60, 1)
```

### RLS Policy Debugging

```sql
-- Test as specific user
SET LOCAL "request.jwt.claims" = '{"sub": "user-uuid-here"}';

-- Try operation
SELECT * FROM subjects;

-- Check which policies are preventing access
SELECT * FROM pg_policies 
WHERE tablename = 'subjects';

-- Disable RLS temporarily for debugging (NOT for production)
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
-- Re-enable after testing
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
```

---

## 📚 Documentation Links

- **Full Security Guide:** `Docs/SECURITY_GUIDE.md`
- **Stage 5 Completion:** `Docs/STAGE_5_COMPLETION.md`
- **Environment Setup:** `.env.example`
- **Testing Script:** `scripts/test-security.sh`

---

## 🔗 External Resources

### Security Testing Tools
- [SecurityHeaders.com](https://securityheaders.com) - Test headers
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/) - Test CSP
- [OWASP ZAP](https://www.zaproxy.org/) - Penetration testing
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Dependency check

### Documentation
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## 🚨 Emergency Procedures

### If Security Breach Detected

1. **Immediate Actions:**
   ```bash
   # Rotate all secrets
   openssl rand -hex 32  # Generate new secret
   supabase secrets set WEBHOOK_SECRET=new-secret
   supabase secrets set N8N_WEBHOOK_SECRET=new-secret
   
   # Check audit logs
   # SELECT * FROM audit_logs WHERE created_at > NOW() - INTERVAL '24 hours';
   ```

2. **Investigation:**
   ```sql
   -- Find suspicious activity
   SELECT * FROM audit_logs 
   WHERE action NOT IN ('chat_message_processed', 'file_uploaded')
   ORDER BY created_at DESC;
   
   -- Check rate limit violations
   SELECT * FROM rate_limit_tracking
   WHERE request_count > 50;
   ```

3. **Mitigation:**
   - Disable affected Edge Functions
   - Force logout all users: Delete auth sessions
   - Review and patch vulnerability
   - Deploy fixes
   - Notify affected users

### Contact

For security issues: [security@your-domain.com]

---

## ✅ Pre-Production Checklist

```bash
# 1. Generate production secrets
openssl rand -hex 32 > webhook_secret.txt
openssl rand -hex 32 > n8n_secret.txt

# 2. Set environment variables
# - Update .env.local
# - Update Supabase Edge Function secrets
# - Update n8n webhook configurations

# 3. Apply database migrations
supabase db push

# 4. Deploy Edge Functions
supabase functions deploy

# 5. Test security
./scripts/test-security.sh

# 6. Verify with online tools
# - securityheaders.com
# - CSP Evaluator

# 7. Monitor logs for 24 hours
supabase functions logs --tail
```

---

**Last Updated:** November 3, 2025  
**Stage:** 5 - Security Hardening  
**Status:** ✅ COMPLETED

