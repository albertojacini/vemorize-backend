# Import Guide

## Shared Code Structure

The `/backend` and `/shared` directories contain business logic from the Next.js app.

### Path Aliases

The imported code uses `@/` path aliases (Next.js convention):
```typescript
import { CourseService } from "@/backend/contexts/courses/services/course-service";
import { ApiLLMRequest } from "@/shared/contracts/api";
```

### Using in Edge Functions

**Option 1: Relative Imports** (Recommended)
```typescript
import { CourseService } from '../../../backend/contexts/courses/services/course-service.ts'
import type { ApiLLMRequest } from '../../../shared/contracts/api.ts'
```

**Option 2: Import Map** (via deno.json)
```json
{
  "imports": {
    "@/backend/": "./backend/",
    "@/shared/": "./shared/"
  }
}
```

Then use:
```typescript
import { CourseService } from "@/backend/contexts/courses/services/course-service.ts"
```

### External Dependencies

Use Deno-style imports:
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
```

## Directory Structure

**`/backend`**: Domain-driven design business logic
- `contexts/` - Bounded contexts (courses, templates, chat)
- `application/` - Use cases and DTOs
- `infrastructure/` - Repository implementations

**`/shared`**: Type contracts shared across projects
- `contracts/` - API contracts (request/response types)
- `types/` - Domain types

## Adapting Code

When copying code to edge functions:
1. Change `@/` imports to relative paths
2. Add `.ts` extensions to imports
3. Replace Node.js-specific code with Deno equivalents
4. Use Supabase client from edge function context
