# AI Assistant Guidelines

Always read SPEC.md and ARCHITECTURE.md before coding.

## Workflow

1. Write test first (TDD)
2. Minimal implementation
3. Refactor if needed

## Edge Functions

- **Runtime**: Deno (not Node.js)
- **Testing**: Use Deno's built-in test runner
- **Structure**: domain/ → application/ → infrastructure/
- **Imports**: Use Deno-style imports (e.g., `npm:openai`)

## Database

- Use Supabase client from `@supabase/supabase-js`
- RLS handles user filtering automatically
- Test with local Supabase: `supabase start`

## Common Commands

```bash
# Test locally
supabase functions serve chat-llm --env-file .env

# Deploy
supabase functions deploy chat-llm

# Run migrations
supabase db push
```

## Don't

- Don't add legacy compatibility
- Don't over-engineer
- Don't skip tests
