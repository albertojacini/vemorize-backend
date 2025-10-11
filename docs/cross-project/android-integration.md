# Android Integration

## Client Configuration

**Production**:
```kotlin
private const val API_BASE_URL = "https://your-project-ref.supabase.co/functions/v1"
```

**Local Development** (Android Emulator):
```kotlin
private const val API_BASE_URL = "http://10.0.2.2:54321/functions/v1"
```

## API Endpoints

### POST /chat-llm

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

## Shared Concepts

- **Learning Tree**: Navigate via parent_id relationships
- **Annotations**: Track progress separately from course structure
- **Auth**: Supabase Auth handles user sessions
- **RLS**: Backend auto-filters data by user_id

## Android Project Location

`~/Projects/vemorize-android`

See Android project's CLAUDE.md for client architecture.
