#!/bin/bash
# Get authenticated user JWT token from local Supabase
# Usage: ./scripts/get-local-token.sh [email] [password]
#
# This script creates/logs in a test user and retrieves their JWT token
# The token can be used to authenticate requests to edge functions during development

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables from .env file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}✗ Error: .env file not found at $ENV_FILE${NC}"
  exit 1
fi

# Source .env file and export variables
set -a
source "$ENV_FILE"
set +a

# Configuration from .env
SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
ANON_KEY="${SUPABASE_ANON_KEY}"

if [ -z "$ANON_KEY" ]; then
  echo -e "${RED}✗ Error: SUPABASE_ANON_KEY not found in .env file${NC}"
  exit 1
fi

# Test user credentials from .env or command line args
EMAIL="${1:-${SUPABASE_TEST_USER_USERNAME:-admin@test.local}}"
PASSWORD="${2:-${SUPABASE_TEST_USER_PASSWORD:-test123456}}"

echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}Getting Local Supabase Auth Token${NC}"
echo -e "${YELLOW}======================================${NC}\n"

echo -e "${BLUE}Using credentials:${NC}"
echo -e "  Email: $EMAIL"
echo -e "  Password: ${PASSWORD//?/*}\n"

# Try to sign up first (will fail if user exists, that's ok)
echo -e "${YELLOW}Step 1: Attempting to create user...${NC}"
SIGNUP_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$SUPABASE_URL/auth/v1/signup" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

SIGNUP_CODE=$(echo "$SIGNUP_RESPONSE" | tail -n1)
SIGNUP_BODY=$(echo "$SIGNUP_RESPONSE" | sed '$d')

if [ "$SIGNUP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ User created successfully${NC}\n"
elif echo "$SIGNUP_BODY" | grep -q "already registered"; then
  echo -e "${BLUE}ℹ User already exists (expected)${NC}\n"
else
  echo -e "${YELLOW}⚠ Signup response (code: $SIGNUP_CODE):${NC}"
  echo "$SIGNUP_BODY" | jq '.' 2>/dev/null || echo "$SIGNUP_BODY"
  echo ""
fi

# Now sign in to get the token
echo -e "${YELLOW}Step 2: Signing in to get token...${NC}"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$LOGIN_CODE" != "200" ]; then
  echo -e "${RED}✗ Login failed (HTTP $LOGIN_CODE)${NC}"
  echo "$LOGIN_BODY" | jq '.' 2>/dev/null || echo "$LOGIN_BODY"
  exit 1
fi

# Extract the access token
ACCESS_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.access_token')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
  echo -e "${RED}✗ Failed to extract access token${NC}"
  echo "$LOGIN_BODY" | jq '.'
  exit 1
fi

echo -e "${GREEN}✓ Successfully authenticated!${NC}\n"

# Display the token
echo -e "${YELLOW}======================================${NC}"
echo -e "${GREEN}Your JWT Token:${NC}"
echo -e "${YELLOW}======================================${NC}"
echo "$ACCESS_TOKEN"
echo ""

# Show how to use it
echo -e "${BLUE}Add this to your .env or .env.local file:${NC}"
echo -e "${YELLOW}SUPABASE_USER_TOKEN=\"$ACCESS_TOKEN\"${NC}"
echo ""

echo -e "${BLUE}Or use directly in curl:${NC}"
echo -e "${YELLOW}curl -H \"Authorization: Bearer $ACCESS_TOKEN\" ...${NC}"
echo ""

# Optionally verify the token works
echo -e "${YELLOW}Step 3: Verifying token...${NC}"
VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$SUPABASE_URL/auth/v1/user" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

VERIFY_CODE=$(echo "$VERIFY_RESPONSE" | tail -n1)
VERIFY_BODY=$(echo "$VERIFY_RESPONSE" | sed '$d')

if [ "$VERIFY_CODE" = "200" ]; then
  USER_ID=$(echo "$VERIFY_BODY" | jq -r '.id')
  USER_EMAIL=$(echo "$VERIFY_BODY" | jq -r '.email')
  echo -e "${GREEN}✓ Token is valid!${NC}"
  echo -e "  User ID: $USER_ID"
  echo -e "  Email: $USER_EMAIL"
  echo ""
else
  echo -e "${RED}✗ Token verification failed${NC}"
  exit 1
fi

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Setup complete!${NC}"
echo -e "${GREEN}======================================${NC}"
