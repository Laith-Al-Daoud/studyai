# StudAI Production Deployment Guide

**Version:** 1.0  
**Last Updated:** November 4, 2025

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Supabase Deployment](#supabase-deployment)
4. [n8n Deployment](#n8n-deployment)
5. [Next.js Application Deployment](#nextjs-application-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying to production, ensure you have:

- [ ] **Supabase Account** (Pro or Team plan recommended for production)
- [ ] **Vercel Account** (for Next.js deployment)
- [ ] **n8n Instance** (self-hosted or cloud)
- [ ] **Domain Name** (optional but recommended)
- [ ] **LLM API Keys** (OpenAI, Anthropic, or Gemini)
- [ ] **LibreOffice** installed on the server (for PPTX conversion)

---

## Environment Setup

### 1. Production Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# n8n Webhook URLs
NEXT_PUBLIC_N8N_FILE_WEBHOOK_URL=https://your-n8n.com/webhook/file-upload
NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL=https://your-n8n.com/webhook/chat
N8N_WEBHOOK_SECRET=your-webhook-secret-key

# Analytics (Optional - Plausible)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com

# Error Tracking (Optional)
NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT=https://your-error-service.com/api/errors

# Node Environment
NODE_ENV=production
```

### 2. Security Checklist

- [ ] All secrets stored in secure environment variable management
- [ ] Webhook secrets are strong (minimum 32 characters)
- [ ] Service role key is never exposed to client-side code
- [ ] CORS properly configured in Supabase
- [ ] Rate limiting enabled on API endpoints
- [ ] SSL/TLS certificates configured

---

## Supabase Deployment

### 1. Create Production Project

```bash
# Navigate to Supabase Dashboard
https://supabase.com/dashboard

# Create new project
- Select region closest to your users
- Choose strong database password
- Enable automatic backups
```

### 2. Run Database Migrations

```bash
cd studai

# Install Supabase CLI
npm install -g supabase

# Link to production project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Verify migrations
supabase db diff
```

### 3. Configure Storage

```bash
# In Supabase Dashboard > Storage:

1. Create 'files' bucket
2. Set to PRIVATE (not public)
3. Configure RLS policies (already in migrations)
4. Set maximum file size to 50MB
```

### 4. Deploy Edge Functions

```bash
# Deploy file-upload-webhook
supabase functions deploy file-upload-webhook \
  --project-ref your-project-ref

# Deploy chat-webhook
supabase functions deploy chat-webhook \
  --project-ref your-project-ref

# Set secrets for Edge Functions
supabase secrets set N8N_WEBHOOK_SECRET=your-webhook-secret
supabase secrets set N8N_FILE_WEBHOOK_URL=https://your-n8n.com/webhook/file-upload
supabase secrets set N8N_CHAT_WEBHOOK_URL=https://your-n8n.com/webhook/chat
```

### 5. Enable Realtime

```bash
# In Supabase Dashboard > Database > Replication:

Enable realtime for tables:
- chats
- flashcards
```

---

## n8n Deployment

### 1. Deploy n8n Instance

**Option A: Self-Hosted (Docker)**

```bash
# Create docker-compose.yml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=your-n8n-domain.com
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://your-n8n-domain.com/
      - GENERIC_TIMEZONE=America/New_York
    volumes:
      - n8n_data:/home/node/.n8n
    restart: unless-stopped

volumes:
  n8n_data:

# Start n8n
docker-compose up -d
```

**Option B: n8n Cloud**

```bash
# Sign up at n8n.cloud
# Create new instance
# Configure custom domain (optional)
```

### 2. Import Workflows

```bash
# Import from studai/Docs/N8N_WORKFLOWS_SIMPLE.md

1. File Upload Processing Workflow
2. Chat Query Processing Workflow
3. PDF Text Extraction Workflow (RAG)
4. Flashcard Generation Workflow
```

### 3. Configure Webhook Security

```bash
# In each workflow:

1. Add "Webhook" node
2. Set authentication to "Header Auth"
3. Add header name: "X-Webhook-Secret"
4. Set value to match N8N_WEBHOOK_SECRET
```

### 4. Test Webhooks

```bash
# Test file webhook
curl -X POST https://your-n8n.com/webhook/file-upload \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-secret" \
  -d '{"fileId":"test","fileName":"test.pdf"}'

# Test chat webhook
curl -X POST https://your-n8n.com/webhook/chat \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-secret" \
  -d '{"chatId":"test","message":"Hello"}'
```

---

## Next.js Application Deployment

### 1. Prepare for Deployment

```bash
cd studai

# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build

# Test production build locally
npm start
```

### 2. Deploy to Vercel

**Via CLI:**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Via Git Integration:**

```bash
1. Push code to GitHub/GitLab/Bitbucket
2. Connect repository to Vercel
3. Configure environment variables in Vercel Dashboard
4. Deploy automatically on push to main branch
```

### 3. Configure Vercel Settings

```bash
# In Vercel Dashboard > Settings:

Build & Development Settings:
- Framework Preset: Next.js
- Build Command: next build
- Output Directory: .next
- Install Command: npm install
- Node Version: 20.x

Environment Variables:
- Add all variables from .env.production
- Ensure NEXT_PUBLIC_* variables are set

Domains:
- Add custom domain
- Configure DNS (A/CNAME records)
- Enable automatic SSL
```

### 4. Post-Deployment Configuration

```bash
# Update Supabase Site URL
# In Supabase Dashboard > Authentication > URL Configuration:
Site URL: https://your-domain.com
Redirect URLs: https://your-domain.com/auth/callback

# Update CORS in Supabase
# In Supabase Dashboard > Settings > API:
Add your domain to allowed origins
```

---

## Post-Deployment Verification

### 1. Functional Testing Checklist

- [ ] **Authentication**
  - [ ] User registration works
  - [ ] Email verification (if enabled)
  - [ ] Login/logout functionality
  - [ ] Password reset flow
  - [ ] Session persistence

- [ ] **Subject Management**
  - [ ] Create subject
  - [ ] Edit subject
  - [ ] Delete subject
  - [ ] View subject list

- [ ] **Chapter Management**
  - [ ] Create chapter
  - [ ] Edit chapter
  - [ ] Delete chapter
  - [ ] View chapter list

- [ ] **File Operations**
  - [ ] Upload PDF file
  - [ ] Upload PPTX file (conversion)
  - [ ] View file list
  - [ ] Delete file
  - [ ] Download file

- [ ] **Chat Interface**
  - [ ] Send message
  - [ ] Receive AI response
  - [ ] Chat history persists
  - [ ] Realtime updates work

- [ ] **Flashcards**
  - [ ] Generate flashcards
  - [ ] View flashcards
  - [ ] Delete flashcards
  - [ ] Navigate between cards

### 2. Performance Testing

```bash
# Check page load times
# Use Chrome DevTools > Performance

Target Metrics:
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1
```

### 3. Security Verification

```bash
# Test RLS policies
# Attempt to access another user's data (should fail)

# Test webhook signatures
# Send request without secret (should fail)

# Test file access
# Attempt to access file without authentication (should fail)

# Check headers
curl -I https://your-domain.com
# Should see security headers (CSP, X-Frame-Options, etc.)
```

---

## Monitoring and Maintenance

### 1. Set Up Monitoring

**Vercel Analytics:**
```bash
# Enable in Vercel Dashboard
# Monitor traffic, performance, and errors
```

**Supabase Dashboard:**
```bash
# Monitor database performance
# Check storage usage
# Review API usage
# Check for slow queries
```

**Error Tracking:**
```bash
# Optional: Set up Sentry
npm install @sentry/nextjs

# Configure in sentry.config.js
# Set NEXT_PUBLIC_SENTRY_DSN environment variable
```

### 2. Database Maintenance

```bash
# Weekly tasks:
- Review database size
- Check for unused indexes
- Monitor query performance
- Review RLS policy performance

# Monthly tasks:
- Vacuum database (automatic in Supabase)
- Review and archive old data
- Update statistics
- Review and optimize slow queries
```

### 3. Backup Strategy

```bash
# Supabase automatic backups (Pro plan):
- Daily backups retained for 7 days
- Weekly backups retained for 4 weeks
- Enable Point-in-Time Recovery (PITR)

# Manual backup:
supabase db dump --project-ref your-project-ref > backup.sql
```

---

## Troubleshooting

### Common Issues

**1. Chat responses not appearing**
```bash
# Check:
- n8n workflow is active
- Webhook secret is correct
- Edge Function logs (Supabase Dashboard > Edge Functions)
- n8n execution logs
```

**2. File upload fails**
```bash
# Check:
- File size is under 50MB
- Storage bucket exists and is private
- RLS policies are correct
- Edge Function has proper permissions
```

**3. PPTX conversion fails**
```bash
# Check:
- LibreOffice is installed on server
- File is valid PPTX format
- Server has enough memory/disk space
```

**4. Realtime updates not working**
```bash
# Check:
- Realtime is enabled for table
- Client is subscribed to correct channel
- RLS policies allow SELECT
- No firewall blocking WebSocket connections
```

### Debug Commands

```bash
# Check Supabase Edge Function logs
supabase functions logs file-upload-webhook --project-ref your-project-ref

# Check Next.js build logs
vercel logs your-deployment-url

# Check database connections
# In Supabase Dashboard > Database > Connection pooler

# Test webhook connectivity
curl -v https://your-n8n.com/webhook/chat
```

---

## Production Optimization

### 1. Performance Tuning

```bash
# Enable caching
# In next.config.ts:
- Set cache headers for static assets
- Enable ISR for static pages
- Use React Server Components

# Database optimization:
- Review and add indexes for slow queries
- Enable connection pooling
- Use prepared statements
```

### 2. Cost Optimization

```bash
# Supabase:
- Monitor database size
- Archive old chat history
- Optimize storage usage
- Use CDN for file delivery

# Vercel:
- Monitor function execution time
- Optimize bundle size
- Use edge functions where possible
```

### 3. Scaling Considerations

```bash
# When to scale:
- Database CPU > 80% consistently
- Storage > 80% of quota
- API requests approaching limits
- File storage growing rapidly

# How to scale:
- Upgrade Supabase plan
- Enable read replicas
- Implement caching layer (Redis)
- Use CDN for static assets
```

---

## Support and Resources

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **n8n Docs:** https://docs.n8n.io
- **Vercel Docs:** https://vercel.com/docs

---

## Deployment Checklist Summary

- [ ] Supabase project created and configured
- [ ] All migrations applied
- [ ] Edge Functions deployed
- [ ] Storage configured with RLS
- [ ] n8n workflows deployed and tested
- [ ] Environment variables configured in Vercel
- [ ] Next.js app deployed to Vercel
- [ ] Custom domain configured (optional)
- [ ] SSL certificates active
- [ ] All functional tests passed
- [ ] Performance metrics within targets
- [ ] Security verification completed
- [ ] Monitoring and alerts configured
- [ ] Backup strategy in place
- [ ] Documentation updated

---

**Congratulations!** Your StudAI application is now live in production. 🎉


