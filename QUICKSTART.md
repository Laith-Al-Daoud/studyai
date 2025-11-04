# StudAI - Quick Start Guide

This guide will help you get StudAI up and running quickly.

## Prerequisites

✅ **Node.js 20.9+** (Required - Next.js 16 requires this version)  
✅ npm or pnpm  
✅ Supabase account  
✅ n8n instance (optional for Stage 1)  

### Check Your Node Version

```bash
node --version
```

If you have Node < 20.9.0, upgrade first:

```bash
# Using nvm (recommended)
nvm install 20
nvm use 20

# Verify
node --version  # Should show v20.x.x
```

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
cd studai
npm install
```

### 2. Set Up Supabase

#### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database to provision (~2 minutes)

#### Get Credentials
1. Go to Project Settings → API
2. Copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key (for migrations)

#### Run Migrations
1. Go to SQL Editor in Supabase Dashboard
2. Copy and run each migration file in order:
   - `supabase/migrations/20250101000000_initial_schema.sql`
   - `supabase/migrations/20250101000001_rls_policies.sql`
   - `supabase/migrations/20250101000002_storage_setup.sql`

### 3. Configure Environment

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and add your Supabase credentials
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# n8n (optional - can skip for now)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/
N8N_API_KEY=your-key

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## What You'll See

- **Landing Page** (`/`) - Feature showcase with CTA buttons
- **Login Page** (`/login`) - Email/password login form (Stage 2)
- **Register Page** (`/register`) - Sign up form (Stage 2)
- **Dashboard** (`/dashboard`) - Will show subjects (Stage 2)

## Current Stage Status

### ✅ Stage 1: Complete
- Next.js setup
- Database schema
- Authentication infrastructure
- Basic UI/layouts

### 🚧 Stage 2: In Progress
- Implement authentication logic
- Subject/Chapter CRUD
- Data fetching hooks

## Verify Setup

### Check Linting
```bash
npm run lint
# Should pass with 0 errors
```

### Check Build (requires Node 20+)
```bash
npm run build
# Should build successfully
```

### Check Database
1. Go to Supabase → Table Editor
2. You should see: `subjects`, `chapters`, `files`, `chats`
3. Go to Storage → Buckets
4. You should see: `pdfs` bucket

## Common Issues

### "Node.js version required"
**Problem:** Your Node version is < 20.9.0  
**Solution:** Upgrade Node using nvm or system package manager

### "Supabase URL not defined"
**Problem:** Environment variables not set  
**Solution:** Copy `.env.example` to `.env.local` and fill in values

### Migrations not running
**Problem:** Tables don't exist in Supabase  
**Solution:** Run migration SQL files in Supabase SQL Editor

### Port already in use
**Problem:** Port 3000 is taken  
**Solution:** 
```bash
# Use different port
PORT=3001 npm run dev
```

## Next Steps

1. **Test Authentication** (Stage 2)
   - Go to `/register`
   - Create an account
   - Login at `/login`

2. **Create Subjects** (Stage 2)
   - Create your first subject
   - Add chapters to it
   - Upload PDFs (Stage 3)

3. **Set up n8n** (Stage 4)
   - Follow `Docs/n8n_setup.md`
   - Configure webhooks
   - Test LLM integration

## Need Help?

- **Documentation:** Check `/Docs` folder
- **README:** See `README.md` for full details
- **Implementation Plan:** `Docs/Implementation.md`
- **n8n Setup:** `Docs/n8n_setup.md`

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Add shadcn component
npx shadcn@latest add <component-name>
```

---

**Ready to Code!** 🚀

The foundation is complete. Stage 2 will add the actual functionality (auth, CRUD operations, etc.).




