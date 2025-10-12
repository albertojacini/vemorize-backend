import { Template } from '@/backend/contexts/templates/entities';


// Repository interface - defines contract for template data access
export interface TemplateRepository {

  // Basic CRUD operations
  save(template: Template): Promise<Template>;
  findById(id: string): Promise<Template | null>;
  findAll(): Promise<Template[]>;
  delete(id: string): Promise<boolean>;

}



