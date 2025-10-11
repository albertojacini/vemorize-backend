# Imported Code Reference

Code imported from Next.js project (`~/Projects/vemorize`).

## Backend Domain Logic (`/backend`)

### Contexts (Bounded Contexts)

**`contexts/courses/`**
- `entities/` - Course, CourseTree, Annotation, Quiz
- `services/` - CourseService (business logic)
- `repositories/` - Course, Annotation, Tree repository interfaces

**`contexts/templates/`**
- `entities/` - Template, TemplateTree
- `services/` - TemplateService
- `repositories/` - Template, TemplateTree repository interfaces

**`contexts/chat/`**
- `entities/` - Conversation, Navigation, UserPreferences
- `services/` - ChatService
- `repositories/` - Conversation, Navigation, UserPreferences interfaces

**`contexts/shared/`**
- `entities/` - BaseTree (shared tree logic)
- `repositories/` - BaseTreeRepository interface

### Application Layer

**`application/dto/`** - Data Transfer Objects for API
**`application/use-cases/`** - Application orchestration logic

### Infrastructure

**`infrastructure/supabase/repositories/`** - Supabase implementations of repository interfaces

### Service Factories

`service-factories.ts` - Factory functions for creating services with dependencies

## Shared Contracts (`/shared`)

### Types (`types/`)
- `chat.ts` - Chat-related types
- `user.ts` - User types

### Contracts

**`contracts/base-interfaces/`** - Domain interface contracts
- courses, templates, annotations
- conversations, navigation, user-preferences
- course-tree, template-tree

**`contracts/db/`** - Database table contracts (matches Supabase schema)
- Matches migrations in `supabase/migrations/`

**`contracts/api/`** - API request/response types
- Used by Android client and edge functions

**`contracts/validators/`** - Type validators and guards

### Config

**`config/tools.ts`** - LLM tool definitions

## Usage in Edge Functions

See [IMPORT_GUIDE.md](IMPORT_GUIDE.md) for how to use this code in Deno edge functions.

**Example: Using repositories in edge function**
```typescript
import { CourseService } from '../../../backend/contexts/courses/services/course-service.ts'
import { SupabaseCourseRepository } from '../../../backend/infrastructure/supabase/repositories/courses/supabase-course-repository.ts'

// In edge function
const courseService = new CourseService(
  new SupabaseCourseRepository(supabaseClient),
  // ... other dependencies
)
```

## Next Steps

As you build edge functions, you can:
1. Copy relevant entity/service classes into edge function directories
2. Adapt imports to use relative paths
3. Use shared contracts for type safety between Android and backend
