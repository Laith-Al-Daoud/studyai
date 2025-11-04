#!/bin/bash

# Get Supabase project URL and anon key from .env.local
if [ -f .env.local ]; then
  source .env.local
else
  echo "Error: .env.local not found"
  exit 1
fi

# Extract project reference from URL (format: https://xxxxx.supabase.co)
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/https:\/\/\([^.]*\).*/\1/')

echo "Project Reference: $PROJECT_REF"
echo ""
echo "Generating TypeScript types..."
echo ""

# Generate types using Supabase API
curl -s "https://api.supabase.com/v1/projects/$PROJECT_REF/types/typescript" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  > src/types/database.ts

if [ $? -eq 0 ] && [ -s src/types/database.ts ]; then
  echo "✅ Types generated successfully!"
  echo "File: src/types/database.ts"
else
  echo "❌ Failed to generate types"
  echo ""
  echo "Alternative: Copy types manually from Supabase Dashboard"
  echo "1. Go to https://supabase.com/dashboard/project/$PROJECT_REF/api?page=tables-intro"
  echo "2. Scroll down to 'Generating Types' section"
  echo "3. Copy the TypeScript types"
  echo "4. Paste into src/types/database.ts"
fi
