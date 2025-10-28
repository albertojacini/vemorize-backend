# Vemorize Backend

Supabase-based backend for the Vemorize voice memorization app.

## Documentation

- **[SPEC.md](SPEC.md)** - Product specification and core concepts
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture guidelines and patterns
- **[CLAUDE.md](CLAUDE.md)** - AI assistant guidelines
- **[SCRIPTS.md](SCRIPTS.md)** - Scripts organization and npm commands guide
- **[Android Integration](docs/cross-project/android-integration.md)** - Client integration guide
- **[Imported Code](docs/IMPORTED_CODE.md)** - Reference for imported backend/shared code
- **[Import Guide](docs/IMPORT_GUIDE.md)** - How to use imported code in edge functions

## Structure

```
backend/                   # Domain logic (imported from Next.js)
├── contexts/              # Bounded contexts (courses, templates, chat)
├── application/           # Use cases & DTOs
└── infrastructure/        # Repository implementations
shared/                    # Type contracts (shared with Android)
├── contracts/             # API, DB, and domain contracts
└── types/                 # Domain types
supabase/
├── functions/             # Edge Functions (Deno)
│   ├── chat-llm/         # LLM conversation handler
│   └── _shared/          # Shared utilities & types
├── migrations/           # Database migrations
└── config.toml           # Supabase configuration
docs/                     # Documentation
```

## Setup

1. **Install Supabase CLI**
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Link to your project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Set environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your keys
   ```

4. **Start local Supabase**
   ```bash
   npm run dev:supabase
   ```

5. **Run migrations** (if starting fresh)
   ```bash
   npm run db:migrate
   ```

6. **Bootstrap database with test data**
   ```bash
   npm run dev:bootstrap
   ```

## Quick Start Commands

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
# Generate template from spec
npm run template:generate lab/agents/template-generator/specs/german-top-100-verbs.yml -- --max-items 1

# Save template to database
npm run template:save lab/agents/template-generator/output/my-template.json

# Create course from template
npm run course:create <template-id> "Course Title" -- --description "Description"
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

## Bootstrap Script Details

The `npm run dev:bootstrap` command runs a comprehensive setup that:
1. Creates/authenticates test user (using credentials from `.env`)
2. Updates `.env` with fresh JWT token
3. Generates German Top 100 Verbs template (1 item for testing)
4. Saves template to database
5. Creates a sample course from the template

**Required environment variables in `.env`:**
- `SUPABASE_URL` - Supabase API URL
- `SUPABASE_ANON_KEY` - Anonymous key for authentication
- `SUPABASE_TEST_USER_USERNAME` - Test user email
- `SUPABASE_TEST_USER_PASSWORD` - Test user password

## Development

### Local Supabase
```bash
npm run dev:supabase        # Start local Supabase
npm run dev:functions       # Serve edge functions
```

### Deploy to production
```bash
npm run deploy:functions    # Deploy edge functions
```

## Database Schema

See `supabase/migrations/20250609200819_initial.sql` for the complete schema including:
- Templates & template families
- Courses & course nodes
- Annotations & quiz data
- Navigation state
- Chat conversations & messages
- User preferences & memory

## Edge Functions

### chat-llm
Handles conversational AI requests from the Android app.

**Endpoint**: `/functions/v1/chat-llm`

**Request**:
```json
{
  "llmContext": {
    "userMessage": "what's next",
    "toolNames": ["provide_chat_response", "switch_mode"],
    "mode": "reading",
    "leafReprForPrompt": "..."
  },
  "data": {
    "courseId": "uuid",
    "userId": "uuid"
  }
}
```

**Response**:
```json
{
  "toolCalls": [
    {
      "id": "call_1",
      "type": "function",
      "function": {
        "name": "provide_chat_response",
        "arguments": "{\"response\": \"...\"}"
      }
    }
  ]
}
```

## Android Integration

Update `ChatApiClient.kt` to point to your Supabase functions:

```kotlin
private const val API_BASE_URL = "https://your-project-ref.supabase.co/functions/v1"
```

For local dev with emulator:
```kotlin
private const val API_BASE_URL = "http://10.0.2.2:54321/functions/v1"
```
