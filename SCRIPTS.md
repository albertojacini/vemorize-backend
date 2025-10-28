# Scripts Organization Guide

This document describes the script organization and available commands in the Vemorize backend.

## Philosophy

All scripts are accessible via **npm run** commands from the project root. This provides:
- Single entry point for all operations
- Self-documenting interface (`npm run` shows all commands)
- Better IDE integration and autocomplete
- Cross-platform compatibility

## Directory Structure

```
scripts/
├── dev/                    # Development helpers
│   ├── bootstrap.sh        # Complete database setup (orchestrates other scripts)
│   └── get-local-token.sh  # Get authentication token
├── templates/              # Template operations (TypeScript)
│   ├── generate.ts         # Generate template (wrapper for agent)
│   └── save.ts             # Save template to database
├── courses/                # Course operations (TypeScript)
│   └── create-from-template.ts  # Create course from template
├── test/                   # Testing scripts
│   ├── test-chat-llm.sh
│   └── test-navigation.sh
├── db/                     # Database operations
│   ├── migrate.sh
│   └── reset.sh
└── deploy/
    └── deploy.sh

types/                      # Shared type definitions
└── api-contracts.ts        # API contracts used by all scripts

lab/                        # Agent code ONLY
└── agents/
    └── template-generator/
        └── cli.ts          # AI-powered template generation agent
```

## Available Commands

### Development
```bash
npm run dev:supabase       # Start local Supabase
npm run dev:functions      # Serve edge functions locally
npm run dev:bootstrap      # Bootstrap database with test data
npm run dev:token          # Get fresh authentication token
```

### Database
```bash
npm run db:reset           # Reset database to clean state
npm run db:migrate         # Run migrations
npm run db:seed            # Seed with test data (alias for dev:bootstrap)
npm run setup              # Reset + bootstrap (complete setup)
npm run fresh-start        # Full reset and bootstrap
```

### Templates & Courses
```bash
# Generate template from spec (wrapper that calls agent)
npm run template:generate lab/agents/template-generator/specs/german-top-100-verbs.yml -- --max-items 1

# Save template to database
npm run template:save lab/agents/template-generator/output/my-template.json

# Create course from template
npm run course:create <template-id> "Course Title" -- --description "Description"

# Direct agent access (advanced)
npm run agent:template lab/agents/template-generator/specs/my-spec.yml -- --max-items 10
```

### Testing
```bash
npm run test:chat          # Test chat-llm edge function
npm run test:nav           # Test navigation functionality
```

### Deployment
```bash
npm run deploy             # Deploy everything
npm run deploy:functions   # Deploy edge functions only
```

## Common Workflows

### Fresh Start (New Developer Setup)
```bash
# 1. Start local Supabase
npm run dev:supabase

# 2. Complete setup (reset + bootstrap)
npm run setup
```

### After Database Reset
```bash
npm run dev:bootstrap
```

### Create New Template and Course
```bash
# 1. Generate template (development mode with 1 item)
npm run template:generate lab/agents/template-generator/specs/my-spec.yml -- --max-items 1

# 2. Save template to database
npm run template:save lab/agents/template-generator/output/my-template.json

# 3. Create course from template (get template ID from previous step)
npm run course:create <template-id> "My Course Title" -- --description "My description"
```

### Daily Development
```bash
# Terminal 1: Supabase
npm run dev:supabase

# Terminal 2: Edge functions
npm run dev:functions

# Terminal 3: Run tests
npm run test:chat
```

## Adding New Scripts

When adding new scripts, follow this pattern:

1. **Create script in appropriate category**:
   - `scripts/dev/` - Development helpers
   - `scripts/test/` - Testing scripts
   - `scripts/db/` - Database operations
   - `scripts/deploy/` - Deployment scripts

2. **Make it executable**:
   ```bash
   chmod +x scripts/category/my-script.sh
   ```

3. **Add npm script in root package.json**:
   ```json
   {
     "scripts": {
       "category:name": "./scripts/category/my-script.sh"
     }
   }
   ```

4. **Document in README.md** under "Quick Start Commands"

## Organization Philosophy

### Scripts vs Agents

**`/scripts`** - Operational scripts (both bash and TypeScript)
- Template operations: `scripts/templates/save.ts`, `scripts/templates/generate.ts`
- Course operations: `scripts/courses/create-from-template.ts`
- Database operations: `scripts/db/migrate.sh`, `scripts/db/reset.sh`
- Development helpers: `scripts/dev/bootstrap.sh`, `scripts/dev/get-local-token.sh`

**`/lab/agents`** - ONLY agent code (AI-powered tools)
- Template generator agent: `lab/agents/template-generator/`
- Future agents would go here

**Why separate?**
- Clear distinction: operational scripts vs AI agents
- Scripts are utilities you call directly
- Agents are complex AI systems with their own internal logic
- No duplication: scripts in `/scripts`, agents in `/lab/agents`, types in `/types`

### Single Package.json

All dependencies are in the root `package.json`:
- Eliminates confusion about where dependencies live
- Single `npm install` for everything
- Scripts and agents both use root `node_modules/`
- Shared types in `/types/` used by all code

## Environment Variables

All scripts load configuration from `.env` in the project root:
- `SUPABASE_URL` - Supabase API URL
- `SUPABASE_ANON_KEY` - Anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- `SUPABASE_USER_TOKEN` - User JWT token (auto-updated by bootstrap)
- `SUPABASE_TEST_USER_USERNAME` - Test user email
- `SUPABASE_TEST_USER_PASSWORD` - Test user password
- `OPENAI_API_KEY` - OpenAI API key (for template generation)

## Best Practices

1. **Always use npm run**: Prefer `npm run dev:token` over `./scripts/dev/get-local-token.sh`
2. **Self-documenting**: Run `npm run` to see all available commands
3. **Categorization**: Keep scripts organized by purpose (dev/test/db/deploy)
4. **Error handling**: All scripts use `set -e` to exit on error
5. **Colored output**: Scripts use color coding for better readability
6. **Path safety**: Scripts use `SCRIPT_DIR` and relative paths to work from any location

## Why Not Make?

We chose npm scripts over Make because:
- ✅ No build artifacts or file dependencies to track
- ✅ Familiar to Node.js developers
- ✅ Better IDE integration
- ✅ Cross-platform (Make has issues on Windows)
- ✅ Self-documenting (`npm run` lists all commands)
- ✅ No additional tools to install
- ✅ Natural fit for Node/TypeScript/Deno project
