import { Annotation } from '@/backend/contexts/courses/entities/annotation';
import { AnnotationRepository } from '@/backend/contexts/courses/repositories/annotation-repository';
import { AnnotationMapper } from '@/backend/infrastructure/mappers/annotation-mapper';
import type { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseAnnotationRepository implements AnnotationRepository {
  protected supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    if (!supabaseClient) {
      throw new Error('Supabase client is required. Use ClientServiceFactory or ServerServiceFactory to create repository instances.');
    }
    
    this.supabase = supabaseClient;
  }

  async create(annotation: Annotation): Promise<Annotation> {
    const annotationDto = annotation.toDto();
    const { data, error } = await this.supabase
      .from('annotations')
      .insert(AnnotationMapper.toPersistence(annotationDto))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create annotation: ${error.message}`);
    }

    const dto = AnnotationMapper.fromPersistence(data);
    return Annotation.fromDto(dto);
  }

  async findById(id: string): Promise<Annotation | null> {
    const { data, error } = await this.supabase
      .from('annotations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get annotation: ${error.message}`);
    }

    if (!data) return null;
    const dto = AnnotationMapper.fromPersistence(data);
    return Annotation.fromDto(dto);
  }

  async findByCourseId(courseId: string): Promise<Annotation[]> {
    const { data, error } = await this.supabase
      .from('annotations')
      .select('*')
      .eq('course_id', courseId);

    if (error) {
      throw new Error(`Failed to load annotations for course ${courseId}: ${error.message}`);
    }

    return data ? data.map(item => {
      const dto = AnnotationMapper.fromPersistence(item);
      return Annotation.fromDto(dto);
    }) : [];
  }

  async findByNodeId(courseId: string, nodeId: string): Promise<Annotation | null> {
    const { data, error } = await this.supabase
      .from('annotations')
      .select('*')
      .eq('course_id', courseId)
      .eq('node_id', nodeId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw new Error(`Failed to get annotation for node: ${error.message}`);
    }

    if (!data) return null;
    const dto = AnnotationMapper.fromPersistence(data);
    return Annotation.fromDto(dto);
  }

  async update(annotation: Annotation): Promise<void> {
    const annotationDto = annotation.toDto();
    const { error } = await this.supabase
      .from('annotations')
      .update(AnnotationMapper.toPersistence(annotationDto))
      .eq('id', annotation.id);

    if (error) {
      throw new Error(`Failed to update annotation: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('annotations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete annotation: ${error.message}`);
    }

    return true;
  }

  async findMultipleByNodeIds(courseId: string, nodeIds: string[]): Promise<Annotation[]> {
    if (nodeIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('annotations')
      .select('*')
      .eq('course_id', courseId)
      .in('node_id', nodeIds);

    if (error) {
      throw new Error(`Failed to load annotations for nodes: ${error.message}`);
    }

    return data ? data.map(item => {
      const dto = AnnotationMapper.fromPersistence(item);
      return Annotation.fromDto(dto);
    }) : [];
  }
}