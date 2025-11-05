# StudyAI - Lightweight Studying Assistant with RAG

StudyAI is a studying assistant that helps authenticated users organize their study materials, upload PDF lecture files, and interact with an AI-powered chat assistant that uses **Retrieval-Augmented Generation (RAG)** to provide context-aware answers based on actual document content.

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), React, TypeScript
- **UI:** TailwindCSS, shadcn/ui, Framer Motion, Lucide Icons
- **Backend:** Supabase (Auth, Database, Storage, Edge Functions, pgvector)
- **LLM Integration:** n8n (Workflow automation), OpenAI (Embeddings), Gemini (Chat)
- **RAG:** pgvector (Vector database), OpenAI text-embedding-3-small, Semantic search

## Project Structure

```
studai/
├── src/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities and configurations
│   ├── hooks/             # Custom React hooks
│   └── types/             # TypeScript type definitions
├── supabase/
│   ├── functions/         # Supabase Edge Functions
│   └── migrations/        # Database migrations
├── Docs/                  # Project documentation
└── public/                # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18.19+ (recommended: 20.9+)
- npm or pnpm
- Supabase account
- n8n instance (for LLM integration)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd studai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials from [Supabase Dashboard](https://app.supabase.com)
   - Add your n8n webhook URLs (see n8n setup below)

4. **Set up Supabase:**
   - Create a new Supabase project
   - Run the migrations in `supabase/migrations/` in order:
     ```bash
     # Option 1: Using Supabase CLI
     supabase migration up

     # Option 2: Copy SQL from migration files and run in Supabase SQL Editor
     ```
   - Ensure RLS policies are enabled

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses the following tables:

- `subjects` - User-created subjects
- `chapters` - Chapters within subjects
- `files` - PDF file metadata + extracted text content
- `chats` - Chat messages and AI responses
- `pdf_chunks` - Vector embeddings for RAG (pgvector) ✨ NEW

All tables implement Row-Level Security (RLS) to ensure data privacy.

### RAG System (NEW)

- **pgvector extension** for storing 1536-dimension embeddings
- **Automatic PDF processing** - Text extraction on upload
- **Text chunking** - 800 characters with 100-char overlap
- **Semantic search** - Cosine similarity matching
- **Context-aware responses** - AI uses actual PDF content

## n8n Webhook Setup

### Prerequisites
- n8n instance (self-hosted or cloud)
- Access to create workflows

### Setup Instructions

1. **Create File Upload Workflow:**
   - Create a new workflow in n8n
   - Add a Webhook node (trigger)
   - Copy the webhook URL to `N8N_WEBHOOK_URL` in `.env.local`
   - Add nodes to process file upload events (e.g., extract text, create embeddings)

2. **Create Chat Workflow:**
   - Create a second workflow for chat processing
   - Add a Webhook node (trigger)
   - Add LLM integration node (OpenAI, Anthropic, etc.)
   - Configure the workflow to:
     - Receive chat message and context
     - Query LLM with user message
     - Return formatted response
   - Copy the webhook URL

3. **Set API Keys:**
   - Set `N8N_API_KEY` in `.env.local` for webhook authentication
   - Configure corresponding secret in n8n workflow

### Example n8n Workflow Structure

**Chat Workflow:**
```
Webhook → LLM Node → Response Node
```

**File Upload Workflow:**
```
Webhook → PDF Parser → Vector Store → Response Node
```

## Development

### Available Scripts

```bash
npm run dev             # Start development server
npm run build           # Create production build
npm run start           # Start production server
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
npm test                # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
npm run analyze         # Analyze bundle size
```

### Adding shadcn/ui Components

```bash
npx shadcn@latest add <component-name>
```

### Database Migrations

To create a new migration:

```bash
# Using Supabase CLI
supabase migration new <migration-name>

# Or manually create in supabase/migrations/
# Format: YYYYMMDDHHMMSS_description.sql
```

## Deployment

### Deploying to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Deploying Supabase Edge Functions

```bash
supabase functions deploy
```

## Features Roadmap

### Stage 1: Foundation ✅
- [x] Next.js setup with TypeScript and App Router
- [x] TailwindCSS dark mode theme
- [x] shadcn/ui components
- [x] Supabase configuration
- [x] Database schema and RLS policies
- [x] Storage bucket configuration
- [x] Basic layout and navigation

### Stage 2: Authentication & Data Management ✅
- [x] User authentication (login, register, password reset)
- [x] Subject CRUD operations
- [x] Chapter CRUD operations
- [x] Dashboard and navigation
- [x] Form validation with Zod
- [x] Toast notifications
- [x] Auth context provider

### Stage 3: File Upload ✅
- [x] PDF upload functionality (drag-and-drop + click)
- [x] File management UI (list, download, delete)
- [x] Supabase Storage integration
- [x] Edge Functions for file processing webhook
- [x] Signed URLs for secure file access
- [x] Client and server-side validation

### Stage 4: Chat Interface with RAG ✅
- [x] Chat UI component
- [x] Message persistence
- [x] Conversation history
- [x] n8n integration
- [x] Realtime updates
- [x] PDF text extraction (automatic) ✨ NEW
- [x] Vector embeddings (OpenAI) ✨ NEW
- [x] Semantic search (pgvector) ✨ NEW
- [x] Context-aware AI responses ✨ NEW

### Stage 5: Security Hardening ✅
- [x] RLS policies thoroughly tested
- [x] Webhook signature verification
- [x] Security headers configured
- [x] Input sanitization

### Stage 6: UI/UX Polish ✅
- [x] Framer Motion animations
- [x] Loading skeletons
- [x] Empty states
- [x] Responsive design
- [x] Error boundaries
- [x] Accessibility improvements

### Stage 7: Testing, Optimization & Deployment ✅
- [x] Unit tests (Jest + React Testing Library) - 66 tests passing
- [x] Test coverage for utilities and validations
- [x] Database query optimization with indexes
- [x] Bundle size optimization
- [x] Error tracking and monitoring system
- [x] Analytics integration (Plausible)
- [x] Performance monitoring
- [x] Production deployment guide
- [x] E2E testing checklist

## Testing

StudAI includes comprehensive testing:

### Unit Tests

```bash
# Run all tests
npm test

# Watch mode (for development)
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test Coverage:**
- ✅ 66 tests passing
- ✅ 100% coverage for utilities
- ✅ 100% coverage for validations

### E2E Testing

Manual E2E testing checklist available in [`E2E_TESTING_CHECKLIST.md`](./E2E_TESTING_CHECKLIST.md)

### Security Testing

- RLS policy verification
- Authentication flow testing
- File access control testing
- Webhook security testing

See [`TESTING_GUIDE.md`](./TESTING_GUIDE.md) for detailed testing procedures.

---

## Monitoring & Analytics

### Error Tracking

Built-in error tracking system with:
- Development logging
- Production error reporting
- Error context capture
- Integration-ready for Sentry

### Analytics

Privacy-focused analytics with Plausible Analytics support:
- Event tracking
- Page view tracking
- Performance monitoring
- Web Vitals reporting

### Performance Monitoring

- Async function measurement
- Web Vitals tracking
- Performance metric logging

See `src/lib/monitoring/` for implementation details.

---

## Documentation

### Getting Started
- [README](./README.md) - This file
- [Environment Setup](./Docs/ENVIRONMENT_SETUP.md)
- [Quickstart Guide](./QUICKSTART.md)

### Development
- [Implementation Plan](../Docs/Implementation.md)
- [Project Structure](../Docs/project_structure.md)
- [UI/UX Guidelines](../Docs/UI_UX_doc.md)

### Features
- **[RAG Setup Guide](./Docs/RAG_SETUP_GUIDE.md)** - RAG implementation
- **[n8n Workflows Simple](./Docs/N8N_WORKFLOWS_SIMPLE.md)** - Step-by-step workflows
- [Flashcards Feature](./Docs/FLASHCARDS_FEATURE.md)
- [PDF Viewer Feature](./PDF_VIEWER_FEATURE.md)

### Testing & Deployment
- **[Testing Guide](./TESTING_GUIDE.md)** - Comprehensive testing procedures ✨ NEW
- **[E2E Testing Checklist](./E2E_TESTING_CHECKLIST.md)** - Manual testing checklist ✨ NEW
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Production deployment ✨ NEW
- **[Environment Template](./ENV_TEMPLATE.md)** - Environment variables ✨ NEW

### Security
- [Security Guide](./Docs/SECURITY_GUIDE.md)
- [Security Quick Reference](./SECURITY_QUICK_REFERENCE.md)

## Contributing

This is a personal project, but contributions are welcome! Please ensure:

- Code follows the established patterns
- TypeScript types are properly defined
- Components are documented
- RLS policies are tested

## License

[Your License Here]

## Support

For issues or questions, please open an issue on the GitHub repository.
