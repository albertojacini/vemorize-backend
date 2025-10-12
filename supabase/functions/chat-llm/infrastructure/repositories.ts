// Simplified repository implementations for edge function
// Avoids importing full backend code with @/ aliases

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { HumanMessage, AIMessage, BaseMessage } from "npm:@langchain/core@0.3.28/messages"

export interface Conversation {
  id: string
  userId: string
  courseId: string
  messageCount: number
  lastMessageAt: Date
  createdAt: Date
  updatedAt: Date
}

export class ConversationRepository {
  constructor(private client: SupabaseClient) {}

  async getOrCreateConversation(userId: string, courseId: string): Promise<Conversation> {
    // Try to find existing conversation
    const { data: existing } = await this.client
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .single()

    if (existing) {
      return {
        id: existing.id,
        userId: existing.user_id,
        courseId: existing.course_id,
        messageCount: existing.message_count,
        lastMessageAt: new Date(existing.last_message_at),
        createdAt: new Date(existing.created_at),
        updatedAt: new Date(existing.updated_at),
      }
    }

    // Create new conversation
    const { data: created, error } = await this.client
      .from('conversations')
      .insert({
        user_id: userId,
        course_id: courseId,
        is_active: true,
        message_count: 0,
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: created.id,
      userId: created.user_id,
      courseId: created.course_id,
      messageCount: created.message_count,
      lastMessageAt: new Date(created.last_message_at),
      createdAt: new Date(created.created_at),
      updatedAt: new Date(created.updated_at),
    }
  }

  async getLangchainMessages(conversationId: string): Promise<BaseMessage[]> {
    const { data, error } = await this.client
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error
    if (!data) return []

    return data.map(msg => {
      const messageData = msg.message_data as any
      if (messageData.type === 'human') {
        return new HumanMessage(messageData.content)
      } else if (messageData.type === 'ai') {
        return new AIMessage(messageData.content)
      }
      return new HumanMessage(messageData.content)
    })
  }

  async storeLangchainMessages(conversationId: string, messages: BaseMessage[]): Promise<void> {
    const records = messages.map(msg => ({
      conversation_id: conversationId,
      message_data: {
        type: msg._getType(),
        content: msg.content,
      },
    }))

    const { error } = await this.client
      .from('messages')
      .insert(records)

    if (error) throw error
  }

  async updateConversation(conversation: Conversation): Promise<void> {
    const { error } = await this.client
      .from('conversations')
      .update({
        message_count: conversation.messageCount,
        last_message_at: conversation.lastMessageAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id)

    if (error) throw error
  }
}
