import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CourseService } from '../../_shared/backend/contexts/courses/services/course-service.ts'
import { SupabaseCourseRepository } from '../../_shared/backend/infrastructure/supabase/repositories/courses/supabase-course-repository.ts'
import { SupabaseAnnotationRepository } from '../../_shared/backend/infrastructure/supabase/repositories/courses/supabase-annotation-repository.ts'
import { SupabaseCourseTreeRepository } from '../../_shared/backend/infrastructure/supabase/repositories/courses/supabase-tree-repository.ts'
import { SupabaseTemplateRepository } from '../../_shared/backend/infrastructure/supabase/repositories/templates/supabase-template-repository.ts'
import { SupabaseTemplateTreeRepository } from '../../_shared/backend/infrastructure/supabase/repositories/templates/supabase-template-tree-repository.ts'
import { CreateCourseFromTemplate } from '../../_shared/backend/application/use-cases/create-course-from-template.ts'

export function createCourseService(supabaseClient: SupabaseClient): CourseService {
  return new CourseService(
    new SupabaseCourseRepository(supabaseClient),
    new SupabaseAnnotationRepository(supabaseClient),
    new SupabaseCourseTreeRepository(supabaseClient)
  )
}

export function createCourseFromTemplateUseCase(supabaseClient: SupabaseClient): CreateCourseFromTemplate {
  return new CreateCourseFromTemplate(
    new SupabaseCourseRepository(supabaseClient),
    new SupabaseTemplateRepository(supabaseClient),
    new SupabaseTemplateTreeRepository(supabaseClient),
    new SupabaseCourseTreeRepository(supabaseClient)
  )
}
