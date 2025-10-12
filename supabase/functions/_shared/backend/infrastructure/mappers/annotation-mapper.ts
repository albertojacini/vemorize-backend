/**
 * Annotation infrastructure mapper
 * Handles conversion between domain entities and infrastructure concerns
 * Following Clean Architecture: Infrastructure → Domain (correct dependency flow)
 */

import { AnnotationData } from '../../../shared/contracts/base-interfaces/annotations.ts';
import { AnnotationData as AnnotationDbData } from '../../../shared/contracts/db/annotations.ts';
import { AnnotationApiResponse } from '../../../shared/contracts/api/annotations.ts';

export class AnnotationMapper {
  
  /**
   * Convert DTO to persistence data (database storage)
   */
  static toPersistence(dto: AnnotationData): AnnotationDbData {
    return {
      id: dto.id,
      course_id: dto.courseId,
      node_id: dto.nodeId,
      created_at: dto.createdAt,
      updated_at: dto.updatedAt,
      memorization_state: dto.memorizationState,
      personal_notes: dto.personalNotes || null,
      visit_count: dto.visitCount
    };
  }

  /**
   * Convert persistence data to DTO
   */
  static fromPersistence(data: AnnotationDbData): AnnotationData {
    return {
      id: data.id,
      courseId: data.course_id,
      nodeId: data.node_id,
      memorizationState: data.memorization_state,
      personalNotes: data.personal_notes || undefined,
      visitCount: data.visit_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Convert DTO to API response (frontend communication)
   */
  static toApiResponse(dto: AnnotationData): AnnotationApiResponse {
    return {
      id: dto.id,
      courseId: dto.courseId,
      nodeId: dto.nodeId,
      memorizationState: dto.memorizationState,
      personalNotes: dto.personalNotes ?? null,
      visitCount: dto.visitCount,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  /**
   * Convert array of DTOs to API response array
   */
  static toApiResponseArray(dtos: AnnotationData[]): AnnotationApiResponse[] {
    return dtos.map(dto => this.toApiResponse(dto));
  }
}