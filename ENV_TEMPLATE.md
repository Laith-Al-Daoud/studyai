# Environment Variables Template

Copy these variables to your `.env.local` file and fill in your values.

```bash
# =====================================================
# SUPABASE CONFIGURATION
# =====================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# =====================================================
# APPLICATION CONFIGURATION
# =====================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# =====================================================
# N8N WEBHOOK CONFIGURATION
# =====================================================
NEXT_PUBLIC_N8N_FILE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/file-upload
NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL=https://your-n8n-instance.com/webhook/chat
N8N_WEBHOOK_SECRET=your-webhook-secret-here

# =====================================================
# ANALYTICS (OPTIONAL)
# =====================================================
# NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com

# =====================================================
# ERROR TRACKING (OPTIONAL)
# =====================================================
# NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT=https://your-error-service.com/api/errors
```

## Security Notes

1. Never commit `.env.local` to version control
2. Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code
3. Never expose `N8N_WEBHOOK_SECRET` to client-side code
4. Use strong, random strings for all secrets
5. Rotate secrets regularly in production


