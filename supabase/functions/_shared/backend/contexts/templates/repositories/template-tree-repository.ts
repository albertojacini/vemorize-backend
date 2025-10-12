import { TemplateTree } from '../entities/template-tree-entity.ts';
import { NodeData } from '../../../../shared/contracts/base-interfaces/template-tree.ts';
import { BaseTreeRepository } from '../../shared/repositories/base-tree-repository.ts';

// Repository interface - defines contract for template data access
export interface TemplateTreeRepository extends BaseTreeRepository<TemplateTree<NodeData>, NodeData> {
  // Inherits: createTree(tree: TemplateTree<NodeData>, contextId: string): Promise<TemplateTree<NodeData>>;
  // Inherits: getTree(contextId: string): Promise<TemplateTree<NodeData> | null>;
}



