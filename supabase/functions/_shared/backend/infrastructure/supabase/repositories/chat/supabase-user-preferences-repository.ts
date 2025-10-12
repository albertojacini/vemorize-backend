import { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { UserPreferences } from '../../../../contexts/chat/entities/user-preferences.ts';
import { UserPreferencesRepository } from '../../../../contexts/chat/repositories/user-preferences-repository.ts';
import { UserPreferencesData } from '../../../../../shared/contracts/db/user-preferences.ts';
import { UserPreferencesMapper } from '../../../mappers/user-preferences-mapper.ts';

export class SupabaseUserPreferencesRepository implements UserPreferencesRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await this.supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    const dto = UserPreferencesMapper.fromPersistence(data);
    return UserPreferences.fromDto(dto);
  }

  async createUserPreferences(preferences: UserPreferences): Promise<UserPreferences> {
    const inputDto = preferences.toDto();
    const data = UserPreferencesMapper.toPersistence(inputDto);

    const { data: created, error } = await this.supabase
      .from('user_preferences')
      .insert(data)
      .select()
      .single();

    if (error || !created) {
      throw new Error(`Failed to create user preferences: ${error?.message}`);
    }

    const createdDto = UserPreferencesMapper.fromPersistence(created);
    return UserPreferences.fromDto(createdDto);
  }

  async updateUserPreferences(preferences: UserPreferences): Promise<UserPreferences> {
    const updateInputDto = preferences.toDto();
    const data = UserPreferencesMapper.toPersistence(updateInputDto);

    const { data: updated, error } = await this.supabase
      .from('user_preferences')
      .update({
        default_tts_model: data.default_tts_model,
        default_speech_speed: data.default_speech_speed,
        reading_speech_speed: data.reading_speech_speed,
        updated_at: data.updated_at
      })
      .eq('id', preferences.id)
      .select()
      .single();

    if (error || !updated) {
      throw new Error(`Failed to update user preferences: ${error?.message}`);
    }

    const updatedDto = UserPreferencesMapper.fromPersistence(updated);
    return UserPreferences.fromDto(updatedDto);
  }

  async upsertUserPreferences(preferences: UserPreferences): Promise<UserPreferences> {
    const upsertInputDto = preferences.toDto();
    const data = UserPreferencesMapper.toPersistence(upsertInputDto);

    const { data: upserted, error } = await this.supabase
      .from('user_preferences')
      .upsert(data, { onConflict: 'user_id' })
      .select()
      .single();

    if (error || !upserted) {
      throw new Error(`Failed to upsert user preferences: ${error?.message}`);
    }

    const upsertedDto = UserPreferencesMapper.fromPersistence(upserted);
    return UserPreferences.fromDto(upsertedDto);
  }
}