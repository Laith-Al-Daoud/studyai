# StudAI Scripts

Utility scripts for development, testing, and deployment.

---

## Available Scripts

### 🔐 test-security.sh

**Purpose:** Automated security testing for Stage 5 security features

**Usage:**
```bash
./scripts/test-security.sh [base-url]

# Examples
./scripts/test-security.sh                     # Test localhost:3000
./scripts/test-security.sh http://localhost:3000
./scripts/test-security.sh https://your-domain.com
```

**What it tests:**
- ✅ Security headers (HSTS, CSP, X-Frame-Options, etc.)
- ✅ Content Security Policy configuration
- ✅ Database migrations presence
- ✅ Edge Function security utilities
- ✅ Environment variables
- ✅ Middleware implementation
- ✅ Documentation completeness
- ✅ Edge Function security updates

**Output:**
- ✅ Green checks for passing tests
- ❌ Red X for failing tests
- ⚠️  Yellow warnings for optional items

**Requirements:**
- `curl` command
- Running development server (for localhost tests)
- Access to project files

---

## Adding New Scripts

When adding new scripts to this directory:

1. **Make it executable:**
   ```bash
   chmod +x scripts/your-script.sh
   ```

2. **Add shebang line:**
   ```bash
   #!/bin/bash
   ```

3. **Document it here:**
   Add a section describing:
   - Purpose
   - Usage
   - What it does
   - Requirements

4. **Use colors for output:**
   ```bash
   RED='\033[0;31m'
   GREEN='\033[0;32m'
   YELLOW='\033[1;33m'
   BLUE='\033[0;34m'
   NC='\033[0m' # No Color
   ```

5. **Include error handling:**
   ```bash
   set -e  # Exit on error
   ```

---

## Script Templates

### Basic Test Script Template

```bash
#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BASE_URL="${1:-http://localhost:3000}"

echo -e "${YELLOW}Starting tests...${NC}"

# Test 1
echo -e "${YELLOW}Test 1: Description${NC}"
if [ condition ]; then
  echo -e "${GREEN}✅ PASS${NC}"
else
  echo -e "${RED}❌ FAIL${NC}"
fi

echo -e "${GREEN}Tests complete!${NC}"
```

---

## Future Script Ideas

### Development Scripts
- `setup-dev.sh` - One-command development environment setup
- `seed-data.sh` - Populate database with test data
- `reset-db.sh` - Reset local database to clean state

### Testing Scripts
- `test-api.sh` - Test all API endpoints
- `test-rls.sh` - Test Row-Level Security policies
- `test-webhooks.sh` - Test n8n webhook integrations

### Deployment Scripts
- `deploy-edge-functions.sh` - Deploy all Edge Functions
- `backup-db.sh` - Backup production database
- `rotate-secrets.sh` - Rotate all security secrets

### Utility Scripts
- `generate-types.sh` - Generate TypeScript types from database
- `check-migrations.sh` - Verify all migrations are applied
- `cleanup-logs.sh` - Clean up old audit logs and rate limits

---

## Contribution Guidelines

When contributing scripts:

1. **Test thoroughly** before committing
2. **Add error handling** for common failure cases
3. **Document usage** in this README
4. **Use consistent formatting** (follow existing scripts)
5. **Add comments** explaining complex operations
6. **Make it idempotent** (safe to run multiple times)
7. **Provide helpful output** (progress updates, clear errors)

---

## Troubleshooting

### Script Won't Run

```bash
# Check permissions
ls -l scripts/test-security.sh

# Make executable
chmod +x scripts/test-security.sh

# Check for Windows line endings (if script from Windows)
dos2unix scripts/test-security.sh
```

### Missing Dependencies

```bash
# Install curl (Ubuntu/Debian)
sudo apt-get install curl

# Install curl (macOS)
brew install curl

# Install jq for JSON parsing (optional)
sudo apt-get install jq  # Ubuntu/Debian
brew install jq          # macOS
```

---

**Maintained By:** Development Team  
**Last Updated:** November 3, 2025

