/**
 * Course infrastructure mapper
 * Handles conversion between domain entities and infrastructure concerns
 * Following Clean Architecture: Infrastructure → Domain (correct dependency flow)
 */

import { CourseData } from '../../../shared/contracts/base-interfaces/courses.ts';
import { CourseDbData } from '../../../shared/contracts/db/courses.ts';
import { CourseApiResponse } from '../../../shared/contracts/api/courses.ts';

export class CourseMapper {

  /**
   * Convert DTO to persistence data (database storage)
   */
  static toPersistence(dto: CourseData): CourseDbData {
    return {
      id: dto.id,
      user_id: dto.userId,
      title: dto.title,
      description: dto.description || null,
      template_id: dto.templateId || null,
      created_at: dto.createdAt,
      updated_at: dto.updatedAt
    };
  }

  /**
   * Convert persistence data to DTO
   */
  static fromPersistence(data: CourseDbData): CourseData {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description || undefined,
      templateId: data.template_id || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Convert DTO to API response (frontend communication)
   */
  static toApiResponse(dto: CourseData): CourseApiResponse {
    return {
      id: dto.id,
      userId: dto.userId,
      title: dto.title,
      description: dto.description ?? null,
      templateId: dto.templateId ?? null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  /**
   * Convert array of DTOs to API response array
   */
  static toApiResponseArray(dtos: CourseData[]): CourseApiResponse[] {
    return dtos.map(dto => this.toApiResponse(dto));
  }
}