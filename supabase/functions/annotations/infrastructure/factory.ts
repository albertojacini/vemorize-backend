import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CourseService } from '../../_shared/backend/contexts/courses/services/course-service.ts'
import { SupabaseCourseRepository } from '../../_shared/backend/infrastructure/supabase/repositories/courses/supabase-course-repository.ts'
import { SupabaseAnnotationRepository } from '../../_shared/backend/infrastructure/supabase/repositories/courses/supabase-annotation-repository.ts'
import { SupabaseCourseTreeRepository } from '../../_shared/backend/infrastructure/supabase/repositories/courses/supabase-tree-repository.ts'

export function createCourseService(supabaseClient: SupabaseClient): CourseService {
  return new CourseService(
    new SupabaseCourseRepository(supabaseClient),
    new SupabaseAnnotationRepository(supabaseClient),
    new SupabaseCourseTreeRepository(supabaseClient)
  )
}
