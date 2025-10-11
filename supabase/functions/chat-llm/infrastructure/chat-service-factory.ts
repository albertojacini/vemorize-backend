// Factory to create ChatService with Supabase repositories
// Adapted for Deno edge function

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ChatService } from '../../../../backend/contexts/chat/services/chat-service.ts'
import { SupabaseConversationRepository } from '../../../../backend/infrastructure/supabase/repositories/chat/supabase-conversation-repository.ts'
import { SupabaseNavigationRepository } from '../../../../backend/infrastructure/supabase/repositories/chat/supabase-navigation-repository.ts'
import { SupabaseUserPreferencesRepository } from '../../../../backend/infrastructure/supabase/repositories/chat/supabase-user-preferences-repository.ts'

export function createChatService(supabaseClient: SupabaseClient): ChatService {
  return new ChatService(
    new SupabaseConversationRepository(supabaseClient),
    new SupabaseNavigationRepository(supabaseClient),
    new SupabaseUserPreferencesRepository(supabaseClient)
  )
}
