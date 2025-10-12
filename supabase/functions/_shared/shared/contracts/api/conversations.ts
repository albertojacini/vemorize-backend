import {
  CreateConversationCommand,
  UpdateConversationCommand,
} from '@/shared/contracts/base-interfaces/conversations';

type CreateConversationApiRequest = CreateConversationCommand;
type UpdateConversationApiRequest = UpdateConversationCommand;

interface ConversationApiResponse {
  id: string;
  userId: string;
  courseId: string;
  messageCount: number;
  summary: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export type {
  CreateConversationApiRequest,
  UpdateConversationApiRequest,
  ConversationApiResponse,
}