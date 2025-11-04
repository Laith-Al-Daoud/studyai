#!/bin/bash

# ================================================
# StudAI Security Testing Script
# ================================================
# Tests security measures implemented in Stage 5
#
# Usage: ./scripts/test-security.sh
# Requirements: curl, jq (optional for JSON parsing)
# ================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:3000}"
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
EDGE_FUNCTION_URL="${SUPABASE_URL}/functions/v1"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}StudAI Security Testing Script${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# ================================================
# Test 1: Security Headers
# ================================================
echo -e "${YELLOW}Test 1: Checking Security Headers...${NC}"

HEADERS=$(curl -sI "${BASE_URL}" 2>/dev/null || echo "")

if [ -z "$HEADERS" ]; then
  echo -e "${RED}❌ FAIL: Could not connect to ${BASE_URL}${NC}"
  echo -e "${YELLOW}   Make sure the development server is running: npm run dev${NC}"
else
  echo -e "${GREEN}✅ Connection successful${NC}"
  
  # Check for each security header
  declare -a REQUIRED_HEADERS=(
    "Content-Security-Policy"
    "Strict-Transport-Security"
    "X-Frame-Options"
    "X-Content-Type-Options"
    "Referrer-Policy"
    "Permissions-Policy"
  )
  
  for HEADER in "${REQUIRED_HEADERS[@]}"; do
    if echo "$HEADERS" | grep -qi "$HEADER"; then
      echo -e "${GREEN}✅ ${HEADER} is present${NC}"
    else
      echo -e "${RED}❌ ${HEADER} is missing${NC}"
    fi
  done
fi

echo ""

# ================================================
# Test 2: CSP Configuration
# ================================================
echo -e "${YELLOW}Test 2: Checking CSP Configuration...${NC}"

CSP=$(curl -sI "${BASE_URL}" 2>/dev/null | grep -i "Content-Security-Policy" || echo "")

if [ -z "$CSP" ]; then
  echo -e "${RED}❌ FAIL: CSP header not found${NC}"
else
  echo -e "${GREEN}✅ CSP header found${NC}"
  
  # Check for key CSP directives
  if echo "$CSP" | grep -q "default-src"; then
    echo -e "${GREEN}✅ default-src directive present${NC}"
  fi
  
  if echo "$CSP" | grep -q "script-src"; then
    echo -e "${GREEN}✅ script-src directive present${NC}"
  fi
  
  if echo "$CSP" | grep -q "frame-ancestors 'none'"; then
    echo -e "${GREEN}✅ frame-ancestors 'none' present (prevents clickjacking)${NC}"
  fi
fi

echo ""

# ================================================
# Test 3: Database Migrations
# ================================================
echo -e "${YELLOW}Test 3: Checking Database Migrations...${NC}"

if [ -f "supabase/migrations/20250101000007_security_enhancements.sql" ]; then
  echo -e "${GREEN}✅ Security enhancements migration exists${NC}"
else
  echo -e "${RED}❌ Security enhancements migration not found${NC}"
fi

echo ""

# ================================================
# Test 4: Edge Function Security Utilities
# ================================================
echo -e "${YELLOW}Test 4: Checking Edge Function Security Utilities...${NC}"

if [ -f "supabase/functions/_shared/security.ts" ]; then
  echo -e "${GREEN}✅ Security utilities file exists${NC}"
  
  # Check for key functions
  if grep -q "verifyWebhookSignature" "supabase/functions/_shared/security.ts"; then
    echo -e "${GREEN}✅ verifyWebhookSignature function found${NC}"
  fi
  
  if grep -q "sanitizeInput" "supabase/functions/_shared/security.ts"; then
    echo -e "${GREEN}✅ sanitizeInput function found${NC}"
  fi
  
  if grep -q "isRateLimited" "supabase/functions/_shared/security.ts"; then
    echo -e "${GREEN}✅ isRateLimited function found${NC}"
  fi
else
  echo -e "${RED}❌ Security utilities file not found${NC}"
fi

echo ""

# ================================================
# Test 5: Environment Variables
# ================================================
echo -e "${YELLOW}Test 5: Checking Environment Variables...${NC}"

declare -a REQUIRED_ENV_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

declare -a OPTIONAL_ENV_VARS=(
  "WEBHOOK_SECRET"
  "N8N_WEBHOOK_SECRET"
  "ALLOWED_ORIGINS"
  "ENVIRONMENT"
)

for VAR in "${REQUIRED_ENV_VARS[@]}"; do
  if [ -n "${!VAR}" ]; then
    echo -e "${GREEN}✅ ${VAR} is set${NC}"
  else
    echo -e "${RED}❌ ${VAR} is not set (REQUIRED)${NC}"
  fi
done

for VAR in "${OPTIONAL_ENV_VARS[@]}"; do
  if [ -n "${!VAR}" ]; then
    echo -e "${GREEN}✅ ${VAR} is set${NC}"
  else
    echo -e "${YELLOW}⚠️  ${VAR} is not set (OPTIONAL for development)${NC}"
  fi
done

echo ""

# ================================================
# Test 6: Middleware Security
# ================================================
echo -e "${YELLOW}Test 6: Checking Middleware Implementation...${NC}"

if [ -f "src/middleware.ts" ]; then
  echo -e "${GREEN}✅ Middleware file exists${NC}"
  
  if grep -q "addSecurityHeaders" "src/middleware.ts"; then
    echo -e "${GREEN}✅ addSecurityHeaders function found${NC}"
  fi
  
  if grep -q "generateNonce" "src/middleware.ts"; then
    echo -e "${GREEN}✅ CSP nonce generation found${NC}"
  fi
  
  if grep -q "getContentSecurityPolicy" "src/middleware.ts"; then
    echo -e "${GREEN}✅ CSP configuration function found${NC}"
  fi
else
  echo -e "${RED}❌ Middleware file not found${NC}"
fi

echo ""

# ================================================
# Test 7: Documentation
# ================================================
echo -e "${YELLOW}Test 7: Checking Documentation...${NC}"

if [ -f "Docs/SECURITY_GUIDE.md" ]; then
  echo -e "${GREEN}✅ Security guide exists${NC}"
else
  echo -e "${RED}❌ Security guide not found${NC}"
fi

if [ -f "Docs/STAGE_5_COMPLETION.md" ]; then
  echo -e "${GREEN}✅ Stage 5 completion report exists${NC}"
else
  echo -e "${YELLOW}⚠️  Stage 5 completion report not found${NC}"
fi

echo ""

# ================================================
# Test 8: Edge Function Updates
# ================================================
echo -e "${YELLOW}Test 8: Checking Edge Function Security Updates...${NC}"

if [ -f "supabase/functions/chat-webhook/index.ts" ]; then
  if grep -q "verifyWebhookSignature" "supabase/functions/chat-webhook/index.ts"; then
    echo -e "${GREEN}✅ Chat webhook has signature verification${NC}"
  else
    echo -e "${RED}❌ Chat webhook missing signature verification${NC}"
  fi
  
  if grep -q "isRateLimited" "supabase/functions/chat-webhook/index.ts"; then
    echo -e "${GREEN}✅ Chat webhook has rate limiting${NC}"
  else
    echo -e "${RED}❌ Chat webhook missing rate limiting${NC}"
  fi
fi

if [ -f "supabase/functions/file-upload-webhook/index.ts" ]; then
  if grep -q "verifyWebhookSignature" "supabase/functions/file-upload-webhook/index.ts"; then
    echo -e "${GREEN}✅ File upload webhook has signature verification${NC}"
  else
    echo -e "${RED}❌ File upload webhook missing signature verification${NC}"
  fi
  
  if grep -q "isRateLimited" "supabase/functions/file-upload-webhook/index.ts"; then
    echo -e "${GREEN}✅ File upload webhook has rate limiting${NC}"
  else
    echo -e "${RED}❌ File upload webhook missing rate limiting${NC}"
  fi
fi

echo ""

# ================================================
# Summary
# ================================================
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Security Testing Complete${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${YELLOW}Manual Testing Required:${NC}"
echo "1. Test cross-account access (create 2 users, try to access other's data)"
echo "2. Test file signed URLs expiration"
echo "3. Test authentication edge cases (expired sessions, concurrent logins)"
echo "4. Perform full security audit of all API endpoints"
echo ""
echo -e "${YELLOW}Recommended Tools:${NC}"
echo "- securityheaders.com - Test security headers"
echo "- OWASP ZAP - Penetration testing"
echo "- npm audit - Check dependencies"
echo ""
echo -e "${GREEN}See Docs/SECURITY_GUIDE.md for detailed testing instructions${NC}"
echo ""

