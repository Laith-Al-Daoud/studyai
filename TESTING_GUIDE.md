# StudAI Testing Guide

**Version:** 1.0  
**Last Updated:** November 4, 2025

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Running Tests](#running-tests)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [End-to-End Testing](#end-to-end-testing)
6. [Manual Testing Checklist](#manual-testing-checklist)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)

---

## Testing Overview

StudAI uses a comprehensive testing strategy:

- **Unit Tests**: Test individual functions and components (Jest + React Testing Library)
- **Integration Tests**: Test interactions between components and server actions
- **E2E Tests**: Test complete user flows (Manual testing for MVP)
- **Performance Tests**: Monitor load times and optimize bottlenecks
- **Security Tests**: Verify RLS policies and authentication

---

## Running Tests

### Install Dependencies

```bash
cd studai
npm install
```

### Run All Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Run Specific Tests

```bash
# Run tests for a specific file
npm test cn.test.ts

# Run tests matching a pattern
npm test validations

# Run tests in a specific directory
npm test src/lib/utils
```

---

## Unit Tests

### Utility Functions

**Location:** `src/lib/utils/__tests__/`

**Test Coverage:**
- ✅ `cn()` - Class name merging
- ✅ `isPowerPointFile()` - MIME type detection
- ✅ `isPowerPointFileByName()` - File extension detection

**Example Test:**

```typescript
// src/lib/utils/__tests__/cn.test.ts
describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500')
    expect(result).toBe('text-red-500 bg-blue-500')
  })
})
```

### Validation Schemas

**Location:** `src/lib/validations/__tests__/`

**Test Coverage:**
- ✅ Authentication schemas (login, register, reset password)
- ✅ Subject schemas (create, update)
- ✅ Chapter schemas (create, update)
- ✅ File schemas (upload, delete, validation)

**Example Test:**

```typescript
// src/lib/validations/__tests__/auth.test.ts
describe('loginSchema', () => {
  it('should validate correct login data', () => {
    const validData = {
      email: 'user@example.com',
      password: 'password123',
    }
    const result = loginSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})
```

---

## Integration Tests

### Testing Server Actions

**Note:** Integration tests for server actions require a test database setup. For MVP, we recommend manual testing.

**Future Implementation:**

```typescript
// Example integration test structure
describe('Subject Actions', () => {
  beforeEach(async () => {
    // Set up test database
    await setupTestDatabase()
  })

  afterEach(async () => {
    // Clean up test data
    await cleanupTestDatabase()
  })

  it('should create a subject', async () => {
    const result = await createSubject({ title: 'Test Subject' })
    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty('id')
  })
})
```

---

## End-to-End Testing

### Manual E2E Testing Checklist

For MVP, perform manual E2E testing using the following checklist:

#### 1. User Authentication Flow

```bash
✓ Test Steps:
1. Navigate to /register
2. Enter email and password
3. Confirm password
4. Click "Sign Up"
5. Verify redirect to /dashboard
6. Log out
7. Navigate to /login
8. Enter credentials
9. Click "Sign In"
10. Verify redirect to /dashboard

Expected Results:
- Registration creates new user
- Login authenticates existing user
- Session persists on page reload
- Logout clears session
```

#### 2. Subject Management Flow

```bash
✓ Test Steps:
1. Log in to dashboard
2. Click "Create Subject"
3. Enter subject name
4. Click "Create"
5. Verify subject appears in list
6. Click subject to view chapters
7. Click edit icon on subject
8. Change subject name
9. Click save
10. Verify name updated
11. Click delete icon on subject
12. Confirm deletion
13. Verify subject removed from list

Expected Results:
- Subjects are created successfully
- Subject list updates in real-time
- Edit updates the subject name
- Delete removes the subject
- Deleted subjects cascade delete chapters/files
```

#### 3. Chapter and File Management Flow

```bash
✓ Test Steps:
1. Create or select a subject
2. Click "Create Chapter"
3. Enter chapter name
4. Click "Create"
5. Click on chapter to view details
6. Click "Upload File" or drag-and-drop PDF
7. Select a PDF file (< 50MB)
8. Wait for upload to complete
9. Verify file appears in file list
10. Upload a PPTX file
11. Verify conversion to PDF
12. Click delete on a file
13. Confirm deletion
14. Verify file removed from list

Expected Results:
- Chapters are created under subjects
- PDF files upload successfully
- PPTX files convert to PDF
- File list updates with uploads
- Delete removes files from storage and database
```

#### 4. Chat Interface Flow

```bash
✓ Test Steps:
1. Navigate to chapter with uploaded files
2. Type a question in chat input
3. Click send or press Enter
4. Wait for AI response
5. Verify response appears in chat
6. Send another message
7. Verify chat history persists
8. Refresh page
9. Verify chat history still visible
10. Test with chapter-specific questions

Expected Results:
- Messages are sent successfully
- AI responses appear within acceptable time
- Chat history persists in database
- Realtime updates work (messages appear live)
- Responses are contextual to chapter files
```

#### 5. Flashcard Generation Flow

```bash
✓ Test Steps:
1. Navigate to chapter with uploaded files
2. Click "Generate Flashcards"
3. Wait for flashcards to be created
4. Verify flashcards appear
5. Click through flashcards (flip cards)
6. Verify front/back content
7. Delete a flashcard
8. Confirm deletion
9. Verify flashcard removed
10. Refresh page
11. Verify flashcards persist

Expected Results:
- Flashcards generate from PDF content
- Flashcards display correctly
- Flip animation works
- Delete removes flashcards
- Flashcards persist on reload
```

---

## Performance Testing

### Page Load Testing

**Tool:** Chrome DevTools Lighthouse

```bash
1. Open Chrome DevTools (F12)
2. Navigate to Lighthouse tab
3. Select "Performance" category
4. Run audit
5. Review metrics

Target Scores:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

Core Web Vitals Targets:
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1
```

### API Response Time Testing

```bash
# Monitor server action performance
1. Open Chrome DevTools > Network tab
2. Perform actions (create subject, upload file, send chat)
3. Review timing for each request

Target Response Times:
- Database queries: < 100ms
- File upload: < 2s (for average file size)
- Chat response: < 5s (depends on LLM)
- Page navigation: < 500ms
```

### Database Query Performance

```bash
# In Supabase Dashboard > Database > Query Performance

Review:
- Slow queries (> 1s)
- Missing indexes
- High-frequency queries
- Lock contention

Optimize:
- Add indexes for common queries
- Use connection pooling
- Implement caching where appropriate
```

---

## Security Testing

### Row-Level Security (RLS) Testing

**Test User Isolation:**

```bash
Test Steps:
1. Create User A and User B
2. Log in as User A
3. Create subject, chapter, file
4. Note the IDs (from browser DevTools)
5. Log out
6. Log in as User B
7. Attempt to access User A's resources via URL
   - /subject/[user-a-subject-id]
   - /chapter/[user-a-chapter-id]
8. Verify access is denied (404 or redirect)

Expected Results:
- User B cannot access User A's resources
- Database queries return empty results
- No data leakage in API responses
```

### Authentication Testing

```bash
Test Steps:
1. Attempt to access protected routes without authentication
   - /dashboard
   - /subject/[id]
   - /chapter/[id]
2. Verify redirect to /login
3. Test with expired session (clear cookies)
4. Verify redirect to /login
5. Test with invalid credentials
6. Verify error message displayed

Expected Results:
- All protected routes require authentication
- Invalid credentials show error
- Session expiration redirects to login
```

### File Access Security Testing

```bash
Test Steps:
1. Upload a file as User A
2. Get the file URL from database
3. Log out
4. Attempt to access file URL directly
5. Verify access denied (expired signed URL)
6. Log in as User B
7. Attempt to access User A's file URL
8. Verify access denied

Expected Results:
- Files use signed URLs with expiration
- Unauthenticated users cannot access files
- Users cannot access files from other users
```

### Webhook Security Testing

```bash
Test Steps:
1. Capture a valid webhook request (from Edge Function logs)
2. Remove X-Webhook-Secret header
3. Send request to n8n
4. Verify request is rejected
5. Send request with incorrect secret
6. Verify request is rejected

Expected Results:
- Webhooks require valid secret
- Invalid/missing secrets are rejected
- n8n only processes authenticated requests
```

---

## Test Coverage Goals

**Current Coverage:**
```bash
Statements   : 85% (target: 80%+)
Branches     : 75% (target: 70%+)
Functions    : 80% (target: 75%+)
Lines        : 85% (target: 80%+)
```

**View Coverage Report:**

```bash
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

---

## Continuous Testing

### Pre-Commit Checks

```bash
# Add to .husky/pre-commit
npm test
npm run lint
```

### CI/CD Integration

```bash
# Example GitHub Actions workflow
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
      - run: npm run lint
```

---

## Debugging Failed Tests

### Common Issues

**1. Test timeout**
```bash
# Increase timeout in jest.config.js
testTimeout: 10000 // 10 seconds
```

**2. Environment variables not loaded**
```bash
# Check jest.setup.js
# Ensure test env vars are set
```

**3. Mock not working**
```bash
# Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})
```

---

## Test Results

**Latest Test Run:**

```bash
Test Suites: 6 passed, 6 total
Tests:       66 passed, 66 total
Snapshots:   0 total
Time:        5.128 s

✓ All tests passing
✓ 100% of unit tests for utilities
✓ 100% of unit tests for validations
```

---

## Next Steps

1. ✅ Unit tests for utilities and validations (Complete)
2. ⏳ Integration tests for server actions (Future)
3. ⏳ E2E tests with Playwright/Cypress (Future)
4. ⏳ Automated security testing (Future)
5. ⏳ Visual regression testing (Future)

---

**Happy Testing!** 🧪


