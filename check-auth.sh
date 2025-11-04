#!/bin/bash

echo "🔍 Checking Supabase Auth Configuration..."
echo ""
echo "Common login issues:"
echo "1. Email not verified (most common)"
echo "2. Supabase email settings"
echo "3. Wrong credentials"
echo ""
echo "Let's check your Supabase project settings..."
echo ""

source .env.local
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/https:\/\/\([^.]*\).*/\1/')

echo "📋 Your Supabase Dashboard:"
echo "https://supabase.com/dashboard/project/$PROJECT_REF"
echo ""
echo "🔧 Check Authentication Settings:"
echo "https://supabase.com/dashboard/project/$PROJECT_REF/auth/users"
echo ""
echo "Look for:"
echo "- Your registered user in the Users table"
echo "- Check if 'Email Confirmed' column is TRUE or FALSE"
echo ""
