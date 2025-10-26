import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ChatService } from '../../_shared/backend/contexts/chat/services/chat-service.ts'
import { SupabaseConversationRepository } from '../../_shared/backend/infrastructure/supabase/repositories/chat/supabase-conversation-repository.ts'
import { SupabaseNavigationRepository } from '../../_shared/backend/infrastructure/supabase/repositories/chat/supabase-navigation-repository.ts'
import { SupabaseUserPreferencesRepository } from '../../_shared/backend/infrastructure/supabase/repositories/chat/supabase-user-preferences-repository.ts'

export function createChatService(supabaseClient: SupabaseClient): ChatService {
  return new ChatService(
    new SupabaseConversationRepository(supabaseClient),
    new SupabaseNavigationRepository(supabaseClient),
    new SupabaseUserPreferencesRepository(supabaseClient)
  )
}
