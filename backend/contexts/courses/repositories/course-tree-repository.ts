import { CourseTree } from '@/backend/contexts/courses/entities/course-tree';
import { NodeData } from '@/shared/contracts/base-interfaces/course-tree';
import { BaseTreeRepository } from '@/backend/contexts/shared/repositories/base-tree-repository';

// Repository interface - defines contract for course data access
export interface CourseTreeRepository extends BaseTreeRepository<CourseTree<NodeData>, NodeData> {
  // Inherits: createTree(tree: CourseTree<NodeData>, contextId: string): Promise<CourseTree<NodeData>>;
  // Inherits: getTree(contextId: string): Promise<CourseTree<NodeData> | null>;
}



