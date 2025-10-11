/**
 * Template infrastructure mapper
 * Handles conversion between domain entities and infrastructure concerns
 * Following Clean Architecture: Infrastructure → Domain (correct dependency flow)
 */

import { TemplateData } from '@/shared/contracts/base-interfaces/templates';
import { TemplateData as TemplateDbData } from '@/shared/contracts/db/templates';
import { TemplateApiResponse } from '@shared/contracts/api/templates';
import { TemplateTreeMapper } from './template-tree-mapper';

export class TemplateMapper {
  
  /**
   * Convert DTO to persistence data (database storage)
   */
  static toPersistence(dto: TemplateData): TemplateDbData {
    return {
      id: dto.id,
      template_family_id: dto.templateFamilyId || null,
      name: dto.title,
      description: dto.description || null,
      version: dto.version,
      created_at: dto.createdAt,
      updated_at: dto.updatedAt
    };
  }

  /**
   * Convert persistence data to DTO
   */
  static fromPersistence(templateData: TemplateDbData): TemplateData {
    return {
      id: templateData.id,
      title: templateData.name,
      description: templateData.description || undefined,
      templateFamilyId: templateData.template_family_id || undefined,
      version: templateData.version,
      createdAt: templateData.created_at,
      updatedAt: templateData.updated_at
    };
  }

  /**
   * Convert DTO to API response (frontend communication)
   */
  static toApiResponse(dto: TemplateData): TemplateApiResponse {
    return {
      id: dto.id,
      templateFamilyId: dto.templateFamilyId ?? null,
      title: dto.title,
      description: dto.description ?? null,
      version: dto.version,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  /**
   * Convert array of DTOs to API response array
   */
  static toApiResponseArray(dtos: TemplateData[]): TemplateApiResponse[] {
    return dtos.map(dto => this.toApiResponse(dto));
  }
}