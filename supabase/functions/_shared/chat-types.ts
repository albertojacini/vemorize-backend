// Chat API types - Deno compatible version
import { ToolCall, ToolName } from './tools.ts'

export enum Mode {
  IDLE = 'idle',
  READING = 'reading',
  QUIZ = 'quiz',
}

export interface ApiLLMContext {
  userMessage: string
  toolNames: ToolName[]
  mode: Mode
  userMemory?: string
  leafReprForPrompt?: string
}

export interface ApiLLMDataType {
  courseId: string
  userId: string
}

export interface ApiLLMRequest {
  llmContext: ApiLLMContext
  data: ApiLLMDataType
}

export interface ApiLLMResponse {
  toolCalls: ToolCall[]
  error?: string
}
