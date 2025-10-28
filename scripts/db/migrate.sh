#!/bin/bash
# Run database migrations
# Usage: ./scripts/db/migrate.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running database migrations...${NC}"
supabase db push

echo -e "${GREEN}✓ Migrations completed successfully${NC}"
