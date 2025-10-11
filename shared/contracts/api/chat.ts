import { Mode } from '@/shared/types/chat';
import { ToolName } from '@/shared/config/tools';
import { ToolCall } from '@/shared/config/tools';
import { z } from 'zod';

// TTS Request Schema
export const ttsRequestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional().default('alloy'),
  speed: z.number().min(0.25).max(4.0).optional().default(0.8)
});

export type TtsRequestType = z.infer<typeof ttsRequestSchema>;

// Navigation POST Request Schema  
export const navigationCreateRequestSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  currentLeafId: z.string().min(1, 'Current leaf ID is required')
});

export type NavigationCreateRequestType = z.infer<typeof navigationCreateRequestSchema>;

// Validation schema for PATCH request
export const navigationUpdateRequestParamsSchema = z.object({
  attribute: z.literal('currentLeafId'),
  value: z.string().min(1, 'Leaf ID cannot be empty')
});

export type NavigationUpdateRequestParamsType = z.infer<typeof navigationUpdateRequestParamsSchema>;

export interface NavigationAttributeUpdateResponsePayload {
  success: boolean;
  navigation: {
    id: string;
    userId: string;
    courseId: string;
    currentLeafId: string;
    createdAt: string;
    updatedAt: string;
  };
}






// Session API types
export interface ApiNavigationResponse {
  id: string;
  userId: string;
  courseId: string;
  currentLeafId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiUpdateNavigationRequest {
  currentLeafId: string;
}


export const apiLLMContextSchema = z.object({
  userMessage: z.string().min(1, 'User message is required'),
  toolNames: z.array(z.nativeEnum(ToolName)),
  mode: z.nativeEnum(Mode),
  userMemory: z.string().optional(),

  leafReprForPrompt: z.string().min(1, 'Leaf representation for prompt is required').optional(), // 
});

export type ApiLLMContext = z.infer<typeof apiLLMContextSchema>;

// Enhanced LLM Request Schema (more strict than ApiLLMRequest)
export const apiLLMDataSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

export type ApiLLMDataType = z.infer<typeof apiLLMDataSchema>;

export const ApiLLMRequestSchema = z.object({
  llmContext: apiLLMContextSchema,
  data: apiLLMDataSchema,
});

export type ApiLLMRequest = z.infer<typeof ApiLLMRequestSchema>;

export interface ApiLLMResponse {
  toolCalls: ToolCall[];
  error?: string;
}



