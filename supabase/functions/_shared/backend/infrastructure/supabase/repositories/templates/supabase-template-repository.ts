import { Template } from '@/backend/contexts/templates/entities';
import { TemplateRepository } from '@/backend/contexts/templates/repositories/template-repository';
import { TemplateData } from '@/shared/contracts/db/templates';
import { TemplateMapper } from '@/backend/infrastructure/mappers/template-mapper';
import type { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseTemplateRepository implements TemplateRepository {
  protected supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    if (!supabaseClient) {
      throw new Error('Supabase client is required. Use ClientServiceFactory or ServerServiceFactory to create repository instances.');
    }
    
    this.supabase = supabaseClient;
  }

  async findById(id: string): Promise<Template | null> {
    const { data: templateData, error: templateError } = await this.supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError || !templateData) {
      return null;
    }

    const dto = TemplateMapper.fromPersistence(templateData);
    return Template.fromDto(dto);
  }


  async findAll(): Promise<Template[]> {
    const { data: templatesData, error } = await this.supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load templates: ${error.message}`);
    }

    // Load each template with full data, filtering out invalid ones
    const templates = await Promise.all(
      (templatesData || []).map(async (templateData) => {
        try {
          return await this.findById(templateData.id);
        } catch (error) {
          console.warn(`Skipping invalid template ${templateData.id}:`, error);
          return null;
        }
      })
    );

    return templates.filter(template => template !== null) as Template[];
  }


  async save(template: Template): Promise<Template> {
    // Try to find existing template first
    const existing = await this.findById(template.id);

    if (existing) {
      return this.update(template);
    } else {
      return this.create(template);
    }
  }

  private async create(template: Template): Promise<Template> {
    const templateDto = template.toDto();
    const templatePersistenceData = TemplateMapper.toPersistence(templateDto);
    const templateDataToInsert = templatePersistenceData;

    const { data: templateData, error: templateError } = await this.supabase
      .from('templates')
      .insert(templateDataToInsert)
      .select()
      .single();

    if (templateError) {
      throw new Error(`Failed to create template: ${templateError.message}`);
    }

    return template;
  }

  private async update(template: Template): Promise<Template> {
    // Update template data
    const templateDto = template.toDto();
    const templatePersistenceData = TemplateMapper.toPersistence(templateDto);
    const { data: templateData, error: templateError } = await this.supabase
      .from('templates')
      .update({
        name: templatePersistenceData.name,
        description: templatePersistenceData.description,
        version: templatePersistenceData.version,
        template_family_id: templatePersistenceData.template_family_id,
        updated_at: templatePersistenceData.updated_at
      })
      .eq('id', template.id)
      .select()
      .single();

    if (templateError) {
      throw new Error(`Failed to update template: ${templateError.message}`);
    }

    return template;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('templates')
      .delete()
      .eq('id', id);

    return !error;
  }
}