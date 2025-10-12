// Simplified chat service for edge function
// Avoids importing full backend code with @/ aliases

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { HumanMessage, AIMessage, BaseMessage } from "npm:@langchain/core@0.3.28/messages"
import { ConversationRepository, Conversation } from './repositories.ts'

export class ChatService {
  private conversationRepo: ConversationRepository

  constructor(supabaseClient: SupabaseClient) {
    this.conversationRepo = new ConversationRepository(supabaseClient)
  }

  async getOrCreateConversation(userId: string, courseId: string): Promise<Conversation> {
    return this.conversationRepo.getOrCreateConversation(userId, courseId)
  }

  async getConversationMessages(conversationId: string): Promise<BaseMessage[]> {
    return this.conversationRepo.getLangchainMessages(conversationId)
  }

  async addMessageToConversation(
    conversation: Conversation,
    userMessage: string,
    aiResponse: string
  ): Promise<void> {
    // Create LangChain messages
    const humanMessage = new HumanMessage(userMessage)
    const aiMessage = new AIMessage(aiResponse)

    // Store messages
    await this.conversationRepo.storeLangchainMessages(
      conversation.id,
      [humanMessage, aiMessage]
    )

    // Update conversation metadata
    conversation.messageCount += 2
    conversation.lastMessageAt = new Date()

    await this.conversationRepo.updateConversation(conversation)
  }
}

export function createChatService(supabaseClient: SupabaseClient): ChatService {
  return new ChatService(supabaseClient)
}
