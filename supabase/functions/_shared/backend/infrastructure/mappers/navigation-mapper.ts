/**
 * Navigation infrastructure mapper
 * Handles conversion between domain entities and infrastructure concerns
 * Following Clean Architecture: Infrastructure → Domain (correct dependency flow)
 */

import { NavigationData } from '../../../shared/contracts/base-interfaces/navigation.ts';
import { SessionData } from '../../../shared/contracts/db/courses.ts';
import { ApiNavigationResponse } from '../../../shared/contracts/api/chat.ts';

export class NavigationMapper {
  
  /**
   * Convert DTO to persistence data (database storage)
   */
  static toPersistence(dto: NavigationData): SessionData {
    return {
      id: dto.id,
      user_id: dto.userId,
      course_id: dto.courseId,
      current_leaf_id: dto.currentLeafId,
      created_at: dto.createdAt,
      updated_at: dto.updatedAt
    };
  }

  /**
   * Convert persistence data to DTO
   */
  static fromPersistence(data: SessionData): NavigationData {
    return {
      id: data.id,
      userId: data.user_id,
      courseId: data.course_id,
      currentLeafId: data.current_leaf_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Convert DTO to API response (frontend communication)
   */
  static toApiResponse(dto: NavigationData): ApiNavigationResponse {
    return {
      id: dto.id,
      userId: dto.userId,
      courseId: dto.courseId,
      currentLeafId: dto.currentLeafId,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  /**
   * Convert array of DTOs to API response array
   */
  static toApiResponseArray(dtos: NavigationData[]): ApiNavigationResponse[] {
    return dtos.map(dto => this.toApiResponse(dto));
  }
}