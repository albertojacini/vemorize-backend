import { TemplateTree } from '@/backend/contexts/templates/entities/template-tree-entity';
import { NodeData } from '@/shared/contracts/base-interfaces/template-tree';
import { BaseTreeRepository } from '@/backend/contexts/shared/repositories/base-tree-repository';

// Repository interface - defines contract for template data access
export interface TemplateTreeRepository extends BaseTreeRepository<TemplateTree<NodeData>, NodeData> {
  // Inherits: createTree(tree: TemplateTree<NodeData>, contextId: string): Promise<TemplateTree<NodeData>>;
  // Inherits: getTree(contextId: string): Promise<TemplateTree<NodeData> | null>;
}



