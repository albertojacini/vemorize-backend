import { NavigationRepository } from '../../../../contexts/chat/repositories/navigation-repository.ts';
import { Navigation } from '../../../../contexts/chat/entities/navigation.ts';
import { NavigationMapper } from '../../../mappers/navigation-mapper.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

/**
 * Supabase implementation of the Navigation repository
 * Handles all database operations for navigation
 */
export class SupabaseNavigationRepository implements NavigationRepository {
  constructor(private readonly supabase: SupabaseClient) {
    if (!supabase) {
      throw new Error('Supabase client is required');
    }
  }

  async findById(id: string): Promise<Navigation | null> {
    const { data, error } = await this.supabase
      .from('navigation')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    const dto = NavigationMapper.fromPersistence(data);
    return Navigation.fromDto(dto);
  }

  async findByUserAndCourse(userId: string, courseId: string): Promise<Navigation | null> {
    const { data, error } = await this.supabase
      .from('navigation')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (error || !data) {
      return null;
    }

    const dto = NavigationMapper.fromPersistence(data);
    return Navigation.fromDto(dto);
  }

  async create(session: Navigation): Promise<Navigation> {
    const { data, error } = await this.supabase
      .from('navigation')
      .insert(NavigationMapper.toPersistence(session.toDto()))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    const dto = NavigationMapper.fromPersistence(data);
    return Navigation.fromDto(dto);
  }

  async update(session: Navigation): Promise<void> {
    const { error } = await this.supabase
      .from('navigation')
      .update(NavigationMapper.toPersistence(session.toDto()))
      .eq('id', session.getId());

    if (error) {
      throw new Error(`Failed to update session: ${error.message}`);
    }
  }

  async exists(id: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from('navigation')
      .select('id', { count: 'exact', head: true })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to check session existence: ${error.message}`);
    }

    return count! > 0;
  }

  async deleteByUserAndCourse(userId: string, courseId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('navigation')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (error) {
      throw new Error(`Failed to delete session: ${error.message}`);
    }

    return true;
  }
}