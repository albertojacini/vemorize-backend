#!/bin/bash
# Test script for chat-llm edge function

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
FUNCTION_URL="http://127.0.0.1:54321/functions/v1/chat-llm"
# Local development anon key from .env
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo -e "${YELLOW}Testing chat-llm edge function...${NC}\n"

# Test payload
REQUEST_BODY='{
  "llmContext": {
    "userMessage": "Hello, can you help me learn?",
    "toolNames": ["provide_chat_response", "switch_mode", "exit_mode"],
    "mode": "idle",
    "leafReprForPrompt": "Test content for learning",
    "userMemory": "User is new to the app"
  },
  "data": {
    "courseId": "test-course-id-123",
    "userId": "test-user-id-456"
  }
}'

echo -e "${YELLOW}Sending request:${NC}"
echo "$REQUEST_BODY" | jq '.'

echo -e "\n${YELLOW}Response:${NC}"

# Make the request
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY")

# Extract status code and body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

# Print response
echo "$BODY" | jq '.'

# Check status
echo ""
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Success! HTTP $HTTP_CODE${NC}"
else
  echo -e "${RED}✗ Failed! HTTP $HTTP_CODE${NC}"
  exit 1
fi
