/**
 * UserPreferences infrastructure mapper
 * Handles conversion between domain entities and infrastructure concerns
 * Following Clean Architecture: Infrastructure → Domain (correct dependency flow)
 */

import { UserPreferencesData } from '@/shared/contracts/base-interfaces/user-preferences';
import { UserPreferencesData as UserPreferencesDbData } from '@/shared/contracts/db/user-preferences';
import { UserPreferencesApiResponse } from '@/shared/contracts/api/user-preferences';

export class UserPreferencesMapper {

  /**
   * Convert DTO to persistence data (database storage)
   */
  static toPersistence(dto: UserPreferencesData): UserPreferencesDbData {
    return {
      id: dto.id,
      user_id: dto.userId,
      default_tts_model: dto.defaultTtsModel,
      default_speech_speed: dto.defaultSpeechSpeed,
      reading_speech_speed: dto.readingSpeechSpeed,
      created_at: dto.createdAt,
      updated_at: dto.updatedAt
    };
  }

  /**
   * Convert persistence data to DTO
   */
  static fromPersistence(data: UserPreferencesDbData): UserPreferencesData {
    return {
      id: data.id,
      userId: data.user_id,
      defaultTtsModel: data.default_tts_model,
      defaultSpeechSpeed: data.default_speech_speed,
      readingSpeechSpeed: data.reading_speech_speed,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Convert DTO to API response (frontend communication)
   */
  static toApiResponse(dto: UserPreferencesData): UserPreferencesApiResponse {
    return {
      id: dto.id,
      userId: dto.userId,
      defaultTtsModel: dto.defaultTtsModel,
      defaultSpeechSpeed: dto.defaultSpeechSpeed,
      readingSpeechSpeed: dto.readingSpeechSpeed,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  /**
   * Convert array of DTOs to API response array
   */
  static toApiResponseArray(dtos: UserPreferencesData[]): UserPreferencesApiResponse[] {
    return dtos.map(dto => this.toApiResponse(dto));
  }
}