/**
 * API Contract Types for Template Management
 *
 * These types match the edge function API contracts and ensure
 * type safety between template generator agent and admin CLI.
 */

// Re-export base types from shared contracts
export type {
  CreateTemplateCommand,
  CreateTemplateTreeCommand,
} from '@/shared/contracts/base-interfaces/templates';

export type {
  NodeWithChildrenData,
  ContainerNodeData,
  TextLeafNodeData,
  LanguageVocabularyLeafNodeData,
  CodeLeafNodeData,
} from '@/shared/contracts/base-interfaces/template-tree';

/**
 * Combined DTO structure for template files
 * This is the format saved to output/ directory
 */
export interface TemplateDTOFile {
  template: {
    title: string;
    description?: string;
    templateFamilyId?: string;
    version?: string;
  };
  tree: {
    templateId: string;
    treeData: NodeWithChildrenData;
  };
}

/**
 * Edge function API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  message?: string;
}

/**
 * Template creation response from POST /templates
 */
export interface CreateTemplateResponse {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Template tree creation response from POST /templates?action=create-tree
 */
export interface CreateTemplateTreeResponse {
  templateId: string;
  treeData: NodeWithChildrenData;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  token: string;
  supabaseUrl: string;
}

/**
 * Type guard to validate DTO file structure
 */
export function isValidTemplateDTOFile(data: unknown): data is TemplateDTOFile {
  if (!data || typeof data !== 'object') return false;

  const dto = data as Record<string, unknown>;

  // Check template object
  if (!dto.template || typeof dto.template !== 'object') return false;
  const template = dto.template as Record<string, unknown>;
  if (typeof template.title !== 'string') return false;

  // Check tree object
  if (!dto.tree || typeof dto.tree !== 'object') return false;
  const tree = dto.tree as Record<string, unknown>;
  if (typeof tree.templateId !== 'string') return false;
  if (!tree.treeData || typeof tree.treeData !== 'object') return false;

  return true;
}

/**
 * Type guard for API responses
 */
export function isApiResponse<T = unknown>(data: unknown): data is ApiResponse<T> {
  if (!data || typeof data !== 'object') return false;
  const response = data as Record<string, unknown>;
  return typeof response.success === 'boolean';
}
