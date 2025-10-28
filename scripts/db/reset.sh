#!/bin/bash
# Reset database to clean state
# Usage: ./scripts/db/reset.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠ This will reset your database to a clean state${NC}"
echo -e "${BLUE}All data will be lost. Press Ctrl+C to cancel...${NC}"
sleep 2

echo -e "${YELLOW}Resetting database...${NC}"
supabase db reset

echo -e "${GREEN}✓ Database reset completed${NC}"
echo -e "${BLUE}Run 'npm run dev:bootstrap' to set up test data${NC}"
