# Vemorize Backend

Supabase-based backend for the Vemorize voice memorization app.

## Documentation

- **[SPEC.md](SPEC.md)** - Product specification and core concepts
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture guidelines and patterns
- **[CLAUDE.md](CLAUDE.md)** - AI assistant guidelines
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

4. **Run migrations** (if starting fresh)
   ```bash
   supabase db push
   ```

5. **Deploy edge functions**
   ```bash
   supabase functions deploy chat-llm
   ```

## Development

### Local Supabase
```bash
supabase start
```

### Test edge function locally
```bash
supabase functions serve chat-llm --env-file .env
```

### Deploy to production
```bash
supabase functions deploy chat-llm
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
