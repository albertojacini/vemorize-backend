# Vemorize Backend Specification

Voice-based memorization app backend. Users learn content through interactive voice modes.

## Core Concepts

**Learning Tree**: Hierarchical structure with containers (folders) and leaves (content units).
- Every tree has at least one leaf
- Nodes have parent_id relationships for navigation
- Root nodes have `parent_id IS NULL`

**Content Types**:
- `language_vocabulary`: Word/phrase translations
- `text`: General text content
- `code`: Code snippets

**Memorization States**: `new`, `learning`, `review`, `mastered`

**Learning Modes**: quiz, flashcard, reading, chat

## Backend Responsibilities

1. **Data Storage**: Courses, templates, annotations, progress tracking
2. **LLM Integration**: Chat conversations with tool calling
3. **User Memory**: Cross-course knowledge tracking
4. **Quiz Logic**: Question generation and scoring
5. **Navigation State**: Track user position in learning tree

## Key Rules

- Templates are immutable, courses are mutable
- Annotations are separate from course structure (allows sharing templates)
- One active conversation per user per course
- RLS enforces user data isolation
