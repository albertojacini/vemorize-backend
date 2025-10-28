#!/bin/bash
# Deploy Vemorize backend to Supabase

set -e

echo "🚀 Deploying Vemorize Backend..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

# Deploy edge functions
echo "📦 Deploying edge functions..."
supabase functions deploy chat-llm --no-verify-jwt

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Test the function:"
echo "   curl https://your-project-ref.supabase.co/functions/v1/chat-llm"
echo ""
echo "2. Update Android app ChatApiClient.kt with the production URL"
