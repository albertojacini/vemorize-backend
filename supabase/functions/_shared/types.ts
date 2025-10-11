// Shared TypeScript types for edge functions

export interface ApiLLMContext {
  userMessage: string
  toolNames: string[]
  mode: string
  userMemory?: string
  leafReprForPrompt?: string
}

export interface ApiLLMRequest {
  llmContext: ApiLLMContext
  data: {
    courseId: string
    userId: string
  }
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface LLMApiResponse {
  toolCalls: ToolCall[]
}
