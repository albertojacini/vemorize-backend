#!/bin/bash
# Bootstrap script for setting up Vemorize after database reset
# This script orchestrates modular commands (no duplication):
# 1. Gets authentication token and updates .env
# 2. Generates German Top 100 Verbs template
# 3. Saves template to database
# 4. Creates course from template
#
# Usage: ./scripts/dev/bootstrap.sh

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

# Load environment variables
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}✗ Error: .env file not found at $ENV_FILE${NC}"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

echo -e "${CYAN}=========================================="
echo -e "Vemorize Bootstrap Script"
echo -e "==========================================${NC}\n"

echo -e "${BLUE}Configuration:${NC}"
echo -e "  Project Root: $PROJECT_ROOT"
echo -e "  Supabase URL: ${SUPABASE_URL}"
echo -e "  Test User: ${SUPABASE_TEST_USER_USERNAME}"
echo -e ""

# Step 1: Get authentication token and update .env
echo -e "${YELLOW}Step 1: Getting authentication token...${NC}"
TOKEN_OUTPUT=$("$SCRIPT_DIR/get-local-token.sh" 2>&1)
TOKEN_EXIT_CODE=$?

if [ $TOKEN_EXIT_CODE -ne 0 ]; then
  echo -e "${RED}✗ Failed to get authentication token${NC}"
  echo "$TOKEN_OUTPUT"
  exit 1
fi

# Extract the token from the output
USER_TOKEN=$(echo "$TOKEN_OUTPUT" | grep -A1 "Your JWT Token:" | tail -n1 | xargs)

if [ -z "$USER_TOKEN" ]; then
  echo -e "${RED}✗ Failed to extract JWT token${NC}"
  exit 1
fi

echo -e "${GREEN}✓ JWT token obtained${NC}"

# Update .env file with new token
echo -e "\n${YELLOW}Step 1b: Updating .env file with new token...${NC}"

TEMP_ENV=$(mktemp)
if grep -q "^SUPABASE_USER_TOKEN=" "$ENV_FILE"; then
  sed "s|^SUPABASE_USER_TOKEN=.*|SUPABASE_USER_TOKEN=\"$USER_TOKEN\"|" "$ENV_FILE" > "$TEMP_ENV"
  mv "$TEMP_ENV" "$ENV_FILE"
else
  echo "SUPABASE_USER_TOKEN=\"$USER_TOKEN\"" >> "$ENV_FILE"
fi

# Reload environment with new token
set -a
source "$ENV_FILE"
set +a

echo -e "${GREEN}✓ .env file updated with new token${NC}"

# Step 2: Generate template
echo -e "\n${YELLOW}Step 2: Generating German Top 100 Verbs template...${NC}"

SPEC_FILE="lab/agents/template-generator/specs/german-top-100-verbs.yml"
OUTPUT_DIR="$PROJECT_ROOT/lab/agents/template-generator/output"

if [ ! -f "$PROJECT_ROOT/$SPEC_FILE" ]; then
  echo -e "${RED}✗ Spec file not found: $SPEC_FILE${NC}"
  exit 1
fi

echo -e "${BLUE}Calling template generator (--max-items 1 for testing)...${NC}"

# Call modular template generation script
cd "$PROJECT_ROOT"
tsx scripts/templates/generate.ts "$SPEC_FILE" --max-items 1

if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Template generation failed${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Template generated successfully${NC}"

# Step 3: Save template to database
echo -e "\n${YELLOW}Step 3: Saving template to database...${NC}"

# Find the generated template file
TEMPLATE_FILE=$(find "$OUTPUT_DIR" -name "german-top-100-verbs.template.json" -type f | head -n1)

if [ ! -f "$TEMPLATE_FILE" ]; then
  echo -e "${RED}✗ Template file not found in output directory${NC}"
  echo -e "${BLUE}Looking for: german-top-100-verbs.template.json${NC}"
  echo -e "${BLUE}Output directory: $OUTPUT_DIR${NC}"
  exit 1
fi

echo -e "${BLUE}Saving template: $TEMPLATE_FILE${NC}"

# Call modular save-template script
cd "$PROJECT_ROOT"
SAVE_OUTPUT=$(tsx scripts/templates/save.ts "$TEMPLATE_FILE" 2>&1)
SAVE_EXIT_CODE=$?

echo "$SAVE_OUTPUT"

if [ $SAVE_EXIT_CODE -ne 0 ]; then
  echo -e "${RED}✗ Failed to save template to database${NC}"
  exit 1
fi

# Extract template ID from output
TEMPLATE_ID=$(echo "$SAVE_OUTPUT" | grep -o 'Template ID: [a-f0-9-]*' | cut -d' ' -f3)

if [ -z "$TEMPLATE_ID" ]; then
  echo -e "${RED}✗ Failed to extract template ID from output${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Template saved with ID: $TEMPLATE_ID${NC}"

# Step 4: Create course from template
echo -e "\n${YELLOW}Step 4: Creating course from template...${NC}"

COURSE_TITLE="German Top 100 Verbs - My Course"
COURSE_DESCRIPTION="My personal course for learning the top 100 German verbs"

echo -e "${BLUE}Creating course: $COURSE_TITLE${NC}"

# Call modular create-course script
cd "$PROJECT_ROOT"
CREATE_COURSE_OUTPUT=$(tsx scripts/courses/create-from-template.ts "$TEMPLATE_ID" "$COURSE_TITLE" --description "$COURSE_DESCRIPTION" 2>&1)
CREATE_COURSE_EXIT_CODE=$?

echo "$CREATE_COURSE_OUTPUT"

if [ $CREATE_COURSE_EXIT_CODE -ne 0 ]; then
  echo -e "${RED}✗ Failed to create course${NC}"
  exit 1
fi

# Extract course ID from output
COURSE_ID=$(echo "$CREATE_COURSE_OUTPUT" | grep -o 'Course ID: [a-f0-9-]*' | cut -d' ' -f3)

echo -e "${GREEN}✓ Course created with ID: $COURSE_ID${NC}"

# Final summary
echo -e "\n${CYAN}=========================================="
echo -e "Bootstrap Complete!"
echo -e "==========================================${NC}\n"

echo -e "${GREEN}Summary:${NC}"
echo -e "  ✓ Test user authenticated: ${SUPABASE_TEST_USER_USERNAME}"
echo -e "  ✓ JWT token updated in .env"
echo -e "  ✓ Template generated and saved"
echo -e "  ✓ Template ID: ${TEMPLATE_ID}"
echo -e "  ✓ Course created from template"
echo -e "  ✓ Course ID: ${COURSE_ID}"
echo -e ""

echo -e "${BLUE}You can now start using Vemorize with the generated course!${NC}"
echo -e ""
