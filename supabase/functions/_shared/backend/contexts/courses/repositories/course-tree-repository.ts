import { CourseTree } from '../entities/course-tree.ts';
import { NodeData } from '../../../../shared/contracts/base-interfaces/course-tree.ts';
import { BaseTreeRepository } from '../../shared/repositories/base-tree-repository.ts';

// Repository interface - defines contract for course data access
export interface CourseTreeRepository extends BaseTreeRepository<CourseTree<NodeData>, NodeData> {
  // Inherits: createTree(tree: CourseTree<NodeData>, contextId: string): Promise<CourseTree<NodeData>>;
  // Inherits: getTree(contextId: string): Promise<CourseTree<NodeData> | null>;
}



