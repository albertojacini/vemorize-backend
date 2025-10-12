import { BaseMessage } from "npm:@langchain/core/messages";
import { Conversation } from '../entities/conversation.ts';

// Message types
export interface DBMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool' | 'function';
  content: string | null;
  name?: string | null;
  tool_calls?: any;
  tool_call_id?: string | null;
  metadata?: any;
  sequence_number: number;
  created_at: string;
}

export interface CreateMessageData {
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool' | 'function';
  content?: string | null;
  name?: string | null;
  tool_calls?: any;
  tool_call_id?: string | null;
  metadata?: any;
  sequence_number: number;
}

/**
 * Repository for conversation and message operations
 * Only includes methods that are actually used
 */
export interface ConversationRepository {
  // ========== Conversation Operations ==========

  /**
   * Find conversation by ID
   */
  findById(conversationId: string): Promise<Conversation | null>;

  /**
   * Find conversation by user and course
   */
  findByUserAndCourse(userId: string, courseId: string): Promise<Conversation | null>;

  /**
   * Create new conversation
   */
  create(conversation: Conversation): Promise<Conversation>;

  /**
   * Update existing conversation
   */
  update(conversation: Conversation): Promise<Conversation>;

  /**
   * Get or create conversation with efficient handling
   */
  getOrCreateConversation(userId: string, courseId: string): Promise<Conversation>;

  // ========== Message Operations ==========

  /**
   * Get all messages for a conversation as LangChain objects
   */
  getLangchainMessages(conversationId: string): Promise<BaseMessage[]>;

  /**
   * Store LangChain messages directly
   */
  storeLangchainMessages(
    conversationId: string,
    messages: BaseMessage[]
  ): Promise<void>;

  // ========== LangChain Integration ==========

  /**
   * Convert a LangChain message to database format
   */
  langchainToDBMessage(
    message: BaseMessage,
    conversationId: string,
    sequenceNumber: number
  ): CreateMessageData;

  /**
   * Convert database message to LangChain format
   */
  dbToLangchainMessage(dbMessage: DBMessage): BaseMessage;
}