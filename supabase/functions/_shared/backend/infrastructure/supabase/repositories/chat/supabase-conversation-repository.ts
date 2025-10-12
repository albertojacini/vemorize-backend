import { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { ConversationRepository, DBMessage, CreateMessageData } from '../../../../contexts/chat/repositories/conversation-repository.ts';
import { Conversation } from '../../../../contexts/chat/entities/conversation.ts';
import { ConversationMapper } from '../../../mappers/conversation-mapper.ts';
import { ConversationDbRow } from '../../../../../shared/contracts/db/conversations.ts';
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage,
  FunctionMessage
} from 'npm:@langchain/core/messages';

export class SupabaseConversationRepository implements ConversationRepository {
  constructor(private supabase: SupabaseClient) {}

  // ========== Conversation Operations ==========

  async findById(conversationId: string): Promise<Conversation | null> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error || !data) {
      return null;
    }

    const dto = ConversationMapper.fromPersistence(data as ConversationDbRow);
    return Conversation.fromDto(dto);
  }

  async findByUserAndCourse(userId: string, courseId: string): Promise<Conversation | null> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    const dto = ConversationMapper.fromPersistence(data as ConversationDbRow);
    return Conversation.fromDto(dto);
  }

  async create(conversation: Conversation): Promise<Conversation> {
    const conversationDto = conversation.toDto();
    const persistenceData = ConversationMapper.toPersistence(conversationDto);

    const { data, error } = await this.supabase
      .from('conversations')
      .insert(persistenceData)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create conversation: ${error?.message}`);
    }

    const dto = ConversationMapper.fromPersistence(data as ConversationDbRow);
    return Conversation.fromDto(dto);
  }

  async update(conversation: Conversation): Promise<Conversation> {
    const conversationDto = conversation.toDto();
    const persistenceData = ConversationMapper.toPersistence(conversationDto);

    const { data, error } = await this.supabase
      .from('conversations')
      .update(persistenceData)
      .eq('id', conversation.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update conversation: ${error?.message}`);
    }

    const dto = ConversationMapper.fromPersistence(data as ConversationDbRow);
    return Conversation.fromDto(dto);
  }

  async getOrCreateConversation(userId: string, courseId: string): Promise<Conversation> {
    // Try to find existing active conversation
    const existing = await this.findByUserAndCourse(userId, courseId);

    if (existing) {
      return existing;
    }

    // Create new conversation if none exists
    // Deactivate any existing conversations for this user-course pair first
    await this.supabase
      .from('conversations')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('is_active', true);

    // Create new conversation using the entity
    const newConversation = Conversation.create({ userId, courseId });
    return this.create(newConversation);
  }


  // ========== Message Operations ==========

  async getLangchainMessages(conversationId: string): Promise<BaseMessage[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sequence_number', { ascending: true });

    if (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }

    const dbMessages = data || [];
    return dbMessages.map(msg => this.dbToLangchainMessage(msg));
  }

  async storeLangchainMessages(
    conversationId: string,
    messages: BaseMessage[]
  ): Promise<void> {
    if (messages.length === 0) return;

    // Get the latest sequence number
    const { data: latestMsg, error: seqError } = await this.supabase
      .from('messages')
      .select('sequence_number')
      .eq('conversation_id', conversationId)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .single();

    let startingSequence = 1;
    if (latestMsg && !seqError) {
      startingSequence = latestMsg.sequence_number + 1;
    }

    const messagesData = messages.map((msg, index) =>
      this.langchainToDBMessage(msg, conversationId, startingSequence + index)
    );

    const { error } = await this.supabase
      .from('messages')
      .insert(messagesData);

    if (error) {
      throw new Error(`Failed to store messages: ${error.message}`);
    }
  }

  // ========== LangChain Integration ==========

  langchainToDBMessage(
    message: BaseMessage,
    conversationId: string,
    sequenceNumber: number
  ): CreateMessageData {
    let role: DBMessage['role'];
    let content = message.content;
    let toolCallId = null;
    let name = null;

    // Handle different message types (simplified - no tool call storage)
    if (message instanceof HumanMessage) {
      role = 'user';
    } else if (message instanceof AIMessage) {
      role = 'assistant';
      // No tool call processing - keep it simple
    } else if (message instanceof SystemMessage) {
      role = 'system';
    } else if (message instanceof ToolMessage) {
      role = 'tool';
      toolCallId = message.tool_call_id;
      name = message.name;
    } else if (message instanceof FunctionMessage) {
      role = 'function';
      name = message.name;
    } else {
      // Fallback for unknown message types
      role = 'assistant';
    }

    // Handle content that might be an array or object
    const contentStr = typeof content !== 'string' ? JSON.stringify(content) : content;

    return {
      conversation_id: conversationId,
      role,
      content: contentStr || null,
      name,
      tool_calls: null, // No tool calls stored
      tool_call_id: toolCallId,
      metadata: message.additional_kwargs || null,
      sequence_number: sequenceNumber
    };
  }

  dbToLangchainMessage(dbMessage: DBMessage): BaseMessage {
    const content = dbMessage.content || '';

    switch (dbMessage.role) {
      case 'user':
        return new HumanMessage(content);

      case 'assistant':
        const aiMessage = new AIMessage(content);
        // No tool call processing - keep it simple
        if (dbMessage.metadata) {
          aiMessage.additional_kwargs = dbMessage.metadata;
        }
        return aiMessage;

      case 'system':
        return new SystemMessage(content);

      case 'tool':
        return new ToolMessage({
          content,
          tool_call_id: dbMessage.tool_call_id!,
          name: dbMessage.name || 'unknown_tool'
        });

      case 'function':
        return new FunctionMessage({
          content,
          name: dbMessage.name || 'unknown_function'
        });

      default:
        return new AIMessage(content);
    }
  }

}