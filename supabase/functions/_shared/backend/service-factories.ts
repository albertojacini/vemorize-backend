import { TemplateService } from "./contexts/templates/services/template-service.ts";
import { CourseService } from "./contexts/courses/services/course-service.ts";
import { ChatService } from "./contexts/chat/services/chat-service.ts";
import { SupabaseTemplateRepository } from "./infrastructure/supabase/repositories/templates/supabase-template-repository.ts";
import { SupabaseTemplateTreeRepository } from "./infrastructure/supabase/repositories/templates/supabase-template-tree-repository.ts";

import { createClient } from "../../utils/supabase/clients/ssr.ts";
import { SupabaseCourseRepository } from "./infrastructure/supabase/repositories/courses/supabase-course-repository.ts";
import { SupabaseAnnotationRepository } from "./infrastructure/supabase/repositories/courses/supabase-annotation-repository.ts";
import { SupabaseCourseTreeRepository } from "./infrastructure/supabase/repositories/courses/supabase-tree-repository.ts";
import { SupabaseUserPreferencesRepository } from "./infrastructure/supabase/repositories/chat/supabase-user-preferences-repository.ts";
import { SupabaseNavigationRepository } from "./infrastructure/supabase/repositories/chat/supabase-navigation-repository.ts";
import { SupabaseConversationRepository } from "./infrastructure/supabase/repositories/chat/supabase-conversation-repository.ts";


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