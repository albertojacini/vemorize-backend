import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { TemplateService } from '../../_shared/backend/contexts/templates/services/template-service.ts'
import { SupabaseTemplateRepository } from '../../_shared/backend/infrastructure/supabase/repositories/templates/supabase-template-repository.ts'
import { SupabaseTemplateTreeRepository } from '../../_shared/backend/infrastructure/supabase/repositories/templates/supabase-template-tree-repository.ts'

export function createTemplateService(supabaseClient: SupabaseClient): TemplateService {
  return new TemplateService(
    new SupabaseTemplateRepository(supabaseClient),
    new SupabaseTemplateTreeRepository(supabaseClient)
  )
}
