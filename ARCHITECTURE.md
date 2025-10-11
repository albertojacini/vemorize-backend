# Architecture

Clean Architecture with Domain-Driven Design for Supabase backend.

## Principles

- **Domain-First**: Business logic independent of infrastructure
- **TDD**: Write tests before implementation
- **Simple First**: Start with minimal implementation

## Project Structure

```
supabase/
├── functions/              # Edge Functions (Deno)
│   ├── chat-llm/          # LLM conversation handler
│   │   ├── domain/        # Business entities & logic
│   │   ├── application/   # Use cases
│   │   └── infrastructure/# External services (OpenAI, Supabase)
│   └── _shared/           # Shared utilities & types
└── migrations/            # Database schema
```

## Edge Functions

**Language**: Deno + TypeScript
**Pattern**: Domain → Application → Infrastructure

Example structure:
```typescript
// domain/entities/conversation.ts - pure business logic
// application/usecases/process-message.ts - orchestration
// infrastructure/llm-client.ts - OpenAI integration
// index.ts - HTTP handler
```

## Database

**RLS Policies**: Auto-filter by user_id
**Tree Navigation**: Query via parent_id relationships
**Separation**: Templates (immutable) vs Courses (mutable)

## Dependencies Flow

```
Edge Function → Use Case → Domain Entities → Infrastructure Adapters
       ↓
  HTTP Request → Business Logic → Database/LLM
```

## Testing

- Unit tests: Test domain logic with mocks
- Integration tests: Test use cases with real Supabase
- Keep tests minimal, focus on happy path
