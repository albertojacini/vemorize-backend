interface ConversationData {
  id: string;
  userId: string;
  courseId: string;
  messageCount: number;
  summary?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface CreateConversationCommand {
  userId: string;
  courseId: string;
}

interface UpdateConversationCommand {
  messageCount?: number;
  summary?: string;
  lastMessageAt?: string;
  isActive?: boolean;
}

export type {
  ConversationData,
  CreateConversationCommand,
  UpdateConversationCommand,
}