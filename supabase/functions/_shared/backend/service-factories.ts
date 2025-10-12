import { TemplateService } from "@/backend/contexts/templates/services/template-service";
import { CourseService } from "@/backend/contexts/courses/services/course-service";
import { ChatService } from "@/backend/contexts/chat/services/chat-service";
import { SupabaseTemplateRepository } from "@/backend/infrastructure/supabase/repositories/templates/supabase-template-repository";
import { SupabaseTemplateTreeRepository } from "@/backend/infrastructure/supabase/repositories/templates/supabase-template-tree-repository";

import { createClient } from "@/utils/supabase/clients/ssr";
import { SupabaseCourseRepository } from "@/backend/infrastructure/supabase/repositories/courses/supabase-course-repository";
import { SupabaseAnnotationRepository } from "@/backend/infrastructure/supabase/repositories/courses/supabase-annotation-repository";
import { SupabaseCourseTreeRepository } from "@/backend/infrastructure/supabase/repositories/courses/supabase-tree-repository";
import { SupabaseUserPreferencesRepository } from "@/backend/infrastructure/supabase/repositories/chat/supabase-user-preferences-repository";
import { SupabaseNavigationRepository } from "@/backend/infrastructure/supabase/repositories/chat/supabase-navigation-repository";
import { SupabaseConversationRepository } from "@/backend/infrastructure/supabase/repositories/chat/supabase-conversation-repository";


export const createTemplateService = async () => {
    const client = await createClient();
    return new TemplateService(
        new SupabaseTemplateRepository(client),
        new SupabaseTemplateTreeRepository(client)
    );
}

export const createCourseService = async () => {
    const client = await createClient();
    return new CourseService(
        new SupabaseCourseRepository(client),
        new SupabaseAnnotationRepository(client),
        new SupabaseCourseTreeRepository(client)
    );
}

export const createChatService = async () => {
    const client = await createClient();
    return new ChatService(
        new SupabaseConversationRepository(client),
        new SupabaseNavigationRepository(client),
        new SupabaseUserPreferencesRepository(client)
    );
}