/**
 * Conversation infrastructure mapper
 * Handles conversion between domain entities and infrastructure concerns
 * Following Clean Architecture: Infrastructure → Domain (correct dependency flow)
 */

import { ConversationData } from '../../../shared/contracts/base-interfaces/conversations.ts';
import { ConversationDbRow } from '../../../shared/contracts/db/conversations.ts';
import { ConversationApiResponse } from '../../../shared/contracts/api/conversations.ts';

export class ConversationMapper {

  /**
   * Convert DTO to persistence data (database storage)
   */
  static toPersistence(dto: ConversationData): ConversationDbRow {
    return {
      id: dto.id,
      user_id: dto.userId,
      course_id: dto.courseId,
      message_count: dto.messageCount,
      summary: dto.summary || null,
      last_message_at: dto.lastMessageAt || null,
      created_at: dto.createdAt,
      updated_at: dto.updatedAt,
      is_active: dto.isActive,
    };
  }

  /**
   * Convert persistence data to DTO
   */
  static fromPersistence(data: ConversationDbRow): ConversationData {
    return {
      id: data.id,
      userId: data.user_id,
      courseId: data.course_id,
      messageCount: data.message_count,
      summary: data.summary || undefined,
      lastMessageAt: data.last_message_at || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isActive: data.is_active
    };
  }

  /**
   * Convert DTO to API response (frontend communication)
   */
  static toApiResponse(dto: ConversationData): ConversationApiResponse {
    return {
      id: dto.id,
      userId: dto.userId,
      courseId: dto.courseId,
      messageCount: dto.messageCount,
      summary: dto.summary ?? null,
      lastMessageAt: dto.lastMessageAt ?? null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      isActive: dto.isActive,
    };
  }

  /**
   * Convert array of DTOs to API response array
   */
  static toApiResponseArray(dtos: ConversationData[]): ConversationApiResponse[] {
    return dtos.map(dto => this.toApiResponse(dto));
  }
}